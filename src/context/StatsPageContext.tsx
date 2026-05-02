import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  STATS,
  buildCsvInputsFromDatasets,
  runStats,
  type StatRunResult,
} from "../calculations/pipeline";
import { useCsvData } from "./CsvDataContext";
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
  selectAllInList: (fileNames: string[]) => void;
  deselectAllInList: (fileNames: string[]) => void;
  /**
   * Files recorded at the last successful Calculate. Immutable snapshot: not
   * trimmed or cleared when those files disappear from the library or are renamed.
   */
  lastCalculated: StatsCalculatedEntry[] | null;
  /**
   * One entry per stat job from the last Calculate, keyed by `statId`.
   * Null until the first run. Same snapshot rules as `lastCalculated` (library
   * changes do not clear this).
   */
  statResultsById: ReadonlyMap<string, StatRunResult> | null;
  runCalculate: () => void;
};

const StatsPageContext = createContext<StatsPageContextValue | null>(null);

export function StatsPageProvider({ children }: { children: ReactNode }) {
  const { rows } = useCsvLibrary();
  const { datasets } = useCsvData();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [lastCalculated, setLastCalculated] = useState<
    StatsCalculatedEntry[] | null
  >(null);
  const [statResultsById, setStatResultsById] = useState<ReadonlyMap<
    string,
    StatRunResult
  > | null>(null);

  /** Drop removed files from sidebar selection only; last run snapshot is untouched. */
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
  }, [rows]);

  const runCalculate = useCallback(() => {
    const map = new Map(rows.map((r) => [r.fileName, r]));
    const list: StatsCalculatedEntry[] = [];
    const orderedNames: string[] = [];
    for (const f of selected) {
      const r = map.get(f);
      if (r) {
        list.push({ fileName: r.fileName, displayName: r.displayName });
        orderedNames.push(f);
      }
    }
    if (list.length === 0) {
      return;
    }

    const inputs = buildCsvInputsFromDatasets(orderedNames, datasets);
    const results = runStats(inputs, STATS);
    setStatResultsById(new Map(results.map((r) => [r.statId, r])));
    setLastCalculated(list);
  }, [rows, selected, datasets]);

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

  const value = useMemo(
    (): StatsPageContextValue => ({
      selectedFileNames: selected,
      selectionCount: selected.size,
      toggleFile,
      selectAllInList,
      deselectAllInList,
      lastCalculated,
      statResultsById,
      runCalculate,
    }),
    [
      selected,
      toggleFile,
      selectAllInList,
      deselectAllInList,
      lastCalculated,
      statResultsById,
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
