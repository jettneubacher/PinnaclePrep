import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isTauri } from "@tauri-apps/api/core";
import {
  deleteCSV as deleteStoredCsvFile,
  listCSVs,
  renameCSV,
  saveCSV,
  type CsvMetadata,
} from "../lib/csvStorage";

export type CsvLibraryContextValue = {
  rows: CsvMetadata[];
  loading: boolean;
  error: string | null;
  busy: boolean;
  /** Re-load `metadata.json` from app data (after deletes, external edits, etc.). */
  refresh: () => Promise<void>;
  uploadCsvFile: (file: File) => Promise<void>;
  deleteCsv: (meta: CsvMetadata) => Promise<void>;
  renameCsv: (fileName: string, newDisplayName: string) => Promise<void>;
};

const CsvLibraryContext = createContext<CsvLibraryContextValue | null>(null);

export function CsvLibraryProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<CsvMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isTauri()) {
      setRows([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setRows(await listCSVs());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadCsvFile = useCallback(
    async (file: File) => {
      if (!isTauri()) return;
      setBusy(true);
      setError(null);
      try {
        const text = await file.text();
        await saveCSV(file.name, text);
        await refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const deleteCsv = useCallback(
    async (meta: CsvMetadata) => {
      if (!isTauri()) return;
      setBusy(true);
      setError(null);
      try {
        await deleteStoredCsvFile(meta.fileName);
        await refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const renameCsv = useCallback(
    async (fileName: string, newDisplayName: string) => {
      if (!isTauri()) return;
      setBusy(true);
      setError(null);
      try {
        const next = newDisplayName.trim();
        await renameCSV(fileName, next.length > 0 ? next : fileName);
        await refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const value = useMemo(
    (): CsvLibraryContextValue => ({
      rows,
      loading,
      error,
      busy,
      refresh,
      uploadCsvFile,
      deleteCsv,
      renameCsv,
    }),
    [rows, loading, error, busy, refresh, uploadCsvFile, deleteCsv, renameCsv],
  );

  return (
    <CsvLibraryContext.Provider value={value}>{children}</CsvLibraryContext.Provider>
  );
}

export function useCsvLibrary(): CsvLibraryContextValue {
  const ctx = useContext(CsvLibraryContext);
  if (!ctx) {
    throw new Error("useCsvLibrary must be used within CsvLibraryProvider");
  }
  return ctx;
}
