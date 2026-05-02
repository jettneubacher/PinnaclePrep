import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isTauri } from "@tauri-apps/api/core";
import { parseStoredCsvText } from "../lib/parseStoredCsv";
import { readCSV } from "../lib/csvStorage";
import { useCsvLibrary } from "./CsvLibraryContext";

/** Parsed CSV keyed by on-disk `fileName` from app data (not display name). */
export type CsvDataset = {
  fileName: string;
  fields: string[] | undefined;
  rows: Record<string, unknown>[];
  parseErrors: { message: string; code?: string }[];
};

export type CsvDataContextValue = {
  datasets: Record<string, CsvDataset>;
  loadingByFile: Record<string, boolean>;
  errorsByFile: Record<string, string>;
};

const CsvDataContext = createContext<CsvDataContextValue | null>(null);

export function CsvDataProvider({ children }: { children: ReactNode }) {
  const { rows, loading: libraryLoading } = useCsvLibrary();
  const [datasets, setDatasets] = useState<Record<string, CsvDataset>>({});
  const [loadingByFile, setLoadingByFile] = useState<Record<string, boolean>>(
    {},
  );
  const [errorsByFile, setErrorsByFile] = useState<Record<string, string>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isTauri()) {
      setDatasets({});
      setLoadingByFile({});
      setErrorsByFile({});
      return;
    }
    if (libraryLoading) {
      return;
    }

    const wanted = new Set(rows.map((r) => r.fileName));

    setDatasets((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!wanted.has(k)) delete next[k];
      }
      return next;
    });
    setLoadingByFile((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!wanted.has(k)) delete next[k];
      }
      return next;
    });
    setErrorsByFile((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!wanted.has(k)) delete next[k];
      }
      return next;
    });
  }, [rows, libraryLoading]);

  useEffect(() => {
    if (!isTauri() || libraryLoading) {
      return;
    }

    const wanted = new Set(rows.map((r) => r.fileName));

    for (const r of rows) {
      const fileName = r.fileName;
      if (
        datasets[fileName] ||
        loadingByFile[fileName] ||
        errorsByFile[fileName] ||
        inFlightRef.current.has(fileName)
      ) {
        continue;
      }

      inFlightRef.current.add(fileName);
      void (async () => {
        setLoadingByFile((m) => ({ ...m, [fileName]: true }));
        setErrorsByFile((m) => {
          const next = { ...m };
          delete next[fileName];
          return next;
        });
        try {
          const text = await readCSV(fileName);
          if (!wanted.has(fileName)) {
            return;
          }
          const parsed = parseStoredCsvText(text);
          setDatasets((prev) => {
            if (prev[fileName]) return prev;
            return {
              ...prev,
              [fileName]: {
                fileName,
                fields: parsed.fields,
                rows: parsed.rows,
                parseErrors: parsed.parseErrors.map((e) => ({
                  message: e.message,
                  code: e.code,
                })),
              },
            };
          });
        } catch (e) {
          if (!wanted.has(fileName)) {
            return;
          }
          const msg = e instanceof Error ? e.message : String(e);
          setErrorsByFile((m) => ({ ...m, [fileName]: msg }));
        } finally {
          inFlightRef.current.delete(fileName);
          setLoadingByFile((m) => {
            const next = { ...m };
            delete next[fileName];
            return next;
          });
        }
      })();
    }
  }, [rows, libraryLoading, datasets, loadingByFile, errorsByFile]);

  const value = useMemo(
    (): CsvDataContextValue => ({
      datasets,
      loadingByFile,
      errorsByFile,
    }),
    [datasets, loadingByFile, errorsByFile],
  );

  return (
    <CsvDataContext.Provider value={value}>{children}</CsvDataContext.Provider>
  );
}

export function useCsvData(): CsvDataContextValue {
  const ctx = useContext(CsvDataContext);
  if (!ctx) {
    throw new Error("useCsvData must be used within CsvDataProvider");
  }
  return ctx;
}
