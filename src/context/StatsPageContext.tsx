import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isTauri } from "@tauri-apps/api/core";
import type { TestType } from "../calculations/functions/contextTypes";
import {
  STATS,
  buildCsvInputsFromDatasets,
  runStats,
  type StatRunResult,
  type StatsAnalyticsMeta,
} from "../calculations/pipeline";
import { collectStudentsFromSelectedFiles } from "../calculations/csvRows";
import { useCsvData } from "./CsvDataContext";
import { useCsvLibrary } from "./CsvLibraryContext";

export type StatsStudentEntry = { key: string; label: string };

export type StatsPageContextValue = {
  /** Disk file names currently checked (survives search filter). */
  selectedFileNames: ReadonlySet<string>;
  csvSelectionCount: number;
  toggleFile: (fileName: string) => void;
  selectAllCsvsInList: (fileNames: string[]) => void;
  deselectAllCsvsInList: (fileNames: string[]) => void;
  /** True when each sidebar-selected CSV has a parsed dataset (not still loading). */
  selectedCsvDatasetsReady: boolean;
  /** Students that appear only in currently selected CSVs (updates when CSV selection changes). */
  studentsInSelectedCsvs: StatsStudentEntry[];
  /** Student keys included in stats rows (sidebar). */
  selectedStudentKeys: ReadonlySet<string>;
  studentSelectionCount: number;
  toggleStudent: (studentKey: string) => void;
  selectAllStudentsInList: (keys: string[]) => void;
  deselectAllStudentsInList: (keys: string[]) => void;
  /** Students present in the merged + filtered dataset from the latest successful run. */
  calculationStudents: StatsStudentEntry[] | null;
  /**
   * One entry per stat job from the latest run, keyed by `statId`.
   * Null when no valid run yet (no CSV / no students / still loading inputs).
   */
  statResultsById: ReadonlyMap<string, StatRunResult> | null;
  /** Students from merged + filtered data on last run (same as calculationStudents shape). */
  statsAnalyticsMeta: StatsAnalyticsMeta | null;
  /** True while waiting for CSV parse or while `runStats` is in flight (stale runs discarded). */
  isStatsCalculating: boolean;
  /**
   * Shared ACT / SAT / PSAT choice for charts that filter by standardized test type
   * (single control synced across all such visuals).
   */
  statsChartTestType: TestType;
  setStatsChartTestType: (t: TestType) => void;
};

const StatsPageContext = createContext<StatsPageContextValue | null>(null);

export function StatsPageProvider({ children }: { children: ReactNode }) {
  const { rows } = useCsvLibrary();
  const { datasets, loadingByFile } = useCsvData();
  const [selectedCsvs, setSelectedCsvs] = useState<Set<string>>(() => new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    () => new Set(),
  );
  const [statResultsById, setStatResultsById] = useState<ReadonlyMap<
    string,
    StatRunResult
  > | null>(null);
  const [statsAnalyticsMeta, setStatsAnalyticsMeta] =
    useState<StatsAnalyticsMeta | null>(null);
  const [calculationStudents, setCalculationStudents] = useState<
    StatsStudentEntry[] | null
  >(null);
  const [isStatsCalculating, setIsStatsCalculating] = useState(false);
  const [statsChartTestType, setStatsChartTestType] = useState<TestType>("SAT");

  const statsRunGen = useRef(0);

  const selectedCsvDatasetsReady = useMemo(() => {
    if (selectedCsvs.size === 0) return false;
    for (const f of selectedCsvs) {
      if (!datasets[f] || loadingByFile[f]) return false;
    }
    return true;
  }, [selectedCsvs, datasets, loadingByFile]);

  const studentsInSelectedCsvs = useMemo((): StatsStudentEntry[] => {
    if (!isTauri() || selectedCsvs.size === 0) return [];
    const names = [...selectedCsvs].filter((f) =>
      rows.some((r) => r.fileName === f),
    );
    return collectStudentsFromSelectedFiles(names, datasets);
  }, [selectedCsvs, datasets, rows]);

  const rosterKeysSig = useMemo(
    () => studentsInSelectedCsvs.map((s) => s.key).sort().join("|"),
    [studentsInSelectedCsvs],
  );

  /** Drop removed files from sidebar CSV selection only. */
  useEffect(() => {
    const wanted = new Set(rows.map((r) => r.fileName));
    setSelectedCsvs((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const f of prev) {
        if (wanted.has(f)) next.add(f);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [rows]);

  /** Prune selection to roster; new roster members default to selected. */
  useEffect(() => {
    if (!isTauri()) return;

    if (selectedCsvs.size === 0) {
      setSelectedStudents(new Set());
      return;
    }

    if (!selectedCsvDatasetsReady) {
      return;
    }

    if (studentsInSelectedCsvs.length === 0) {
      setSelectedStudents(new Set());
      return;
    }

    setSelectedStudents((prev) => {
      const rosterSet = new Set(studentsInSelectedCsvs.map((s) => s.key));
      const next = new Set<string>();
      for (const k of prev) {
        if (rosterSet.has(k)) next.add(k);
      }
      for (const s of studentsInSelectedCsvs) {
        if (!prev.has(s.key)) next.add(s.key);
      }
      return next;
    });
  }, [
    rosterKeysSig,
    studentsInSelectedCsvs,
    selectedCsvDatasetsReady,
    selectedCsvs.size,
  ]);

  useEffect(() => {
    if (!isTauri()) {
      setIsStatsCalculating(false);
      return;
    }

    const noCsv = selectedCsvs.size === 0;
    const noStudents = selectedStudents.size === 0;

    if (noCsv || noStudents) {
      statsRunGen.current += 1;
      setStatResultsById(null);
      setStatsAnalyticsMeta(null);
      setCalculationStudents(null);
      setIsStatsCalculating(false);
      return;
    }

    if (!selectedCsvDatasetsReady) {
      statsRunGen.current += 1;
      setIsStatsCalculating(true);
      return;
    }

    const gen = (statsRunGen.current += 1);
    setIsStatsCalculating(true);

    const map = new Map(rows.map((r) => [r.fileName, r]));
    const orderedNames: string[] = [];
    for (const f of selectedCsvs) {
      if (map.has(f)) orderedNames.push(f);
    }

    const calculatedAt = new Date();
    const inputs = buildCsvInputsFromDatasets(orderedNames, datasets);

    queueMicrotask(() => {
      if (gen !== statsRunGen.current) return;
      const { results, analyticsMeta } = runStats(inputs, STATS, {
        calculatedAt,
        includeStudentKeys: selectedStudents,
      });
      if (gen !== statsRunGen.current) return;
      const studentsSnap =
        analyticsMeta?.students.map((s) => ({ key: s.key, label: s.label })) ??
        null;
      setStatResultsById(new Map(results.map((r) => [r.statId, r])));
      setStatsAnalyticsMeta(analyticsMeta);
      setCalculationStudents(studentsSnap);
      setIsStatsCalculating(false);
    });
  }, [
    selectedCsvs,
    selectedStudents,
    selectedCsvDatasetsReady,
    datasets,
    rows,
  ]);

  const toggleFile = useCallback((fileName: string) => {
    setSelectedCsvs((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  }, []);

  const selectAllCsvsInList = useCallback((fileNames: string[]) => {
    if (fileNames.length === 0) return;
    setSelectedCsvs((prev) => {
      const next = new Set(prev);
      for (const f of fileNames) next.add(f);
      return next;
    });
  }, []);

  const deselectAllCsvsInList = useCallback((fileNames: string[]) => {
    if (fileNames.length === 0) return;
    setSelectedCsvs((prev) => {
      const next = new Set(prev);
      for (const f of fileNames) next.delete(f);
      return next;
    });
  }, []);

  const toggleStudent = useCallback((studentKey: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentKey)) next.delete(studentKey);
      else next.add(studentKey);
      return next;
    });
  }, []);

  const selectAllStudentsInList = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      for (const k of keys) next.add(k);
      return next;
    });
  }, []);

  const deselectAllStudentsInList = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      for (const k of keys) next.delete(k);
      return next;
    });
  }, []);

  const value = useMemo(
    (): StatsPageContextValue => ({
      selectedFileNames: selectedCsvs,
      csvSelectionCount: selectedCsvs.size,
      toggleFile,
      selectAllCsvsInList,
      deselectAllCsvsInList,
      selectedCsvDatasetsReady,
      studentsInSelectedCsvs,
      selectedStudentKeys: selectedStudents,
      studentSelectionCount: selectedStudents.size,
      toggleStudent,
      selectAllStudentsInList,
      deselectAllStudentsInList,
      calculationStudents,
      statResultsById,
      statsAnalyticsMeta,
      isStatsCalculating,
      statsChartTestType,
      setStatsChartTestType,
    }),
    [
      selectedCsvs,
      toggleFile,
      selectAllCsvsInList,
      deselectAllCsvsInList,
      selectedCsvDatasetsReady,
      studentsInSelectedCsvs,
      selectedStudents,
      toggleStudent,
      selectAllStudentsInList,
      deselectAllStudentsInList,
      calculationStudents,
      statResultsById,
      statsAnalyticsMeta,
      isStatsCalculating,
      statsChartTestType,
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
