import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCsvLibrary } from "./CsvLibraryContext";

export type DataPageContextValue = {
  selectedFileName: string | null;
  setSelectedFileName: (fileName: string | null) => void;
  /**
   * Session-only column widths (px) for the Data table: disk `fileName` →
   * column header → width. Cleared when that file is removed from the library.
   */
  columnWidthsByFile: Record<string, Record<string, number>>;
  setColumnWidthsForFile: (
    fileName: string,
    widths: Record<string, number>,
  ) => void;
};

const DataPageContext = createContext<DataPageContextValue | null>(null);

export function DataPageProvider({ children }: { children: ReactNode }) {
  const { rows } = useCsvLibrary();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [columnWidthsByFile, setColumnWidthsByFile] = useState<
    Record<string, Record<string, number>>
  >({});

  useEffect(() => {
    if (
      selectedFileName &&
      !rows.some((r) => r.fileName === selectedFileName)
    ) {
      setSelectedFileName(null);
    }
  }, [rows, selectedFileName]);

  useEffect(() => {
    const wanted = new Set(rows.map((r) => r.fileName));
    setColumnWidthsByFile((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!wanted.has(k)) {
          delete next[k];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [rows]);

  const setColumnWidthsForFile = useCallback(
    (fileName: string, widths: Record<string, number>) => {
      setColumnWidthsByFile((prev) => ({
        ...prev,
        [fileName]: { ...widths },
      }));
    },
    [],
  );

  const value = useMemo(
    (): DataPageContextValue => ({
      selectedFileName,
      setSelectedFileName,
      columnWidthsByFile,
      setColumnWidthsForFile,
    }),
    [selectedFileName, columnWidthsByFile, setColumnWidthsForFile],
  );

  return (
    <DataPageContext.Provider value={value}>{children}</DataPageContext.Provider>
  );
}

export function useDataPage(): DataPageContextValue {
  const ctx = useContext(DataPageContext);
  if (!ctx) {
    throw new Error("useDataPage must be used within DataPageProvider");
  }
  return ctx;
}
