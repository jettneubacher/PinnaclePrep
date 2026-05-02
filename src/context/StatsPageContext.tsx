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

export type StatsCalculatedEntry = {
  fileName: string;
  displayName: string;
};

export type StatsPageContextValue = {
  /** Disk file names currently checked (survives search filter). */
  selectedFileNames: ReadonlySet<string>;
  selectionCount: number;
  toggleFile: (fileName: string) => void;
  /** Add every name in the list to the selection. */
  selectAllInList: (fileNames: string[]) => void;
  /** Remove every name in the list from the selection. */
  deselectAllInList: (fileNames: string[]) => void;
  /** Snapshot from the most recent successful Calculate (library metadata at that moment). */
  lastCalculated: StatsCalculatedEntry[] | null;
  runCalculate: () => void;
};

const StatsPageContext = createContext<StatsPageContextValue | null>(null);

export function StatsPageProvider({ children }: { children: ReactNode }) {
  const { rows } = useCsvLibrary();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [lastCalculated, setLastCalculated] = useState<
    StatsCalculatedEntry[] | null
  >(null);

  useEffect(() => {
    const wanted = new Set(rows.map((r) => r.fileName));
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const f of prev) {
        if (wanted.has(f)) next.add(f);
        else changed = true;
      }
      return changed ? next : prev;
    });
    setLastCalculated((prev) => {
      if (!prev) return null;
      const next = prev.filter((e) => wanted.has(e.fileName));
      if (next.length === prev.length) return prev;
      return next.length === 0 ? null : next;
    });
  }, [rows]);

  const toggleFile = useCallback((fileName: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  }, []);

  const selectAllInList = useCallback((fileNames: string[]) => {
    if (fileNames.length === 0) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const f of fileNames) next.add(f);
      return next;
    });
  }, []);

  const deselectAllInList = useCallback((fileNames: string[]) => {
    if (fileNames.length === 0) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const f of fileNames) next.delete(f);
      return next;
    });
  }, []);

  const runCalculate = useCallback(() => {
    const map = new Map(rows.map((r) => [r.fileName, r]));
    const list: StatsCalculatedEntry[] = [];
    for (const f of selected) {
      const r = map.get(f);
      if (r) {
        list.push({ fileName: r.fileName, displayName: r.displayName });
      }
    }
    if (list.length > 0) {
      setLastCalculated(list);
    }
  }, [rows, selected]);

  const value = useMemo(
    (): StatsPageContextValue => ({
      selectedFileNames: selected,
      selectionCount: selected.size,
      toggleFile,
      selectAllInList,
      deselectAllInList,
      lastCalculated,
      runCalculate,
    }),
    [
      selected,
      toggleFile,
      selectAllInList,
      deselectAllInList,
      lastCalculated,
      runCalculate,
    ],
  );

  return (
    <StatsPageContext.Provider value={value}>
      {children}
    </StatsPageContext.Provider>
  );
}

export function useStatsPage(): StatsPageContextValue {
  const ctx = useContext(StatsPageContext);
  if (!ctx) {
    throw new Error("useStatsPage must be used within StatsPageProvider");
  }
  return ctx;
}
