import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isTauri } from "@tauri-apps/api/core";
import Sidebar from "../../components/Sidebar";
import { STATS } from "../../calculations/stats";
import { useCsvLibrary } from "../../context/CsvLibraryContext";
import { useStatsPage } from "../../context/StatsPageContext";
import { formatUploadDate } from "../../lib/formatUploadedEst";
import type { CsvMetadata } from "../../lib/csvStorage";
import { StatVisualization } from "./components/StatVisualization";
import { StatsPageToc } from "./components/StatsPageToc";

const SUMMARY_HEADLINE_STAT_ID = "summary_headline_by_test_type";

function computeStatsDisplayOrder(): typeof STATS {
  const summary = STATS.find((d) => d.id === SUMMARY_HEADLINE_STAT_ID);
  const rest = STATS.filter((d) => d.id !== SUMMARY_HEADLINE_STAT_ID);
  return summary ? [summary, ...rest] : [...STATS];
}

type SidebarTab = "csvs" | "students";

function filterCsvRows(rows: CsvMetadata[], query: string): CsvMetadata[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.displayName.toLowerCase().includes(q) ||
      r.fileName.toLowerCase().includes(q),
  );
}

function filterStudents<T extends { key: string; label: string }>(
  list: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) => s.label.toLowerCase().includes(q));
}

function StatsPageInner() {
  const { rows, loading, busy } = useCsvLibrary();
  const {
    selectedFileNames,
    csvSelectionCount,
    toggleFile,
    selectAllCsvsInList,
    deselectAllCsvsInList,
    selectedCsvDatasetsReady,
    studentsInSelectedCsvs,
    selectedStudentKeys,
    studentSelectionCount,
    toggleStudent,
    selectAllStudentsInList,
    deselectAllStudentsInList,
    statResultsById,
    isStatsCalculating,
  } = useStatsPage();

  const [activeTab, setActiveTab] = useState<SidebarTab>("csvs");
  const [searchCsv, setSearchCsv] = useState("");
  const [searchStudent, setSearchStudent] = useState("");

  const inTauri = isTauri();

  const filteredCsv = useMemo(
    () => filterCsvRows(rows, searchCsv),
    [rows, searchCsv],
  );
  const filteredCsvNames = useMemo(
    () => filteredCsv.map((r) => r.fileName),
    [filteredCsv],
  );

  const filteredStudents = useMemo(
    () => filterStudents(studentsInSelectedCsvs, searchStudent),
    [studentsInSelectedCsvs, searchStudent],
  );
  const filteredStudentKeys = useMemo(
    () => filteredStudents.map((s) => s.key),
    [filteredStudents],
  );

  const allFilteredCsvSelected =
    filteredCsv.length > 0 &&
    filteredCsv.every((r) => selectedFileNames.has(r.fileName));

  const allFilteredStudentsSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentKeys.has(s.key));

  const onToggleCsvBulk = () => {
    if (filteredCsvNames.length === 0) return;
    if (allFilteredCsvSelected) {
      deselectAllCsvsInList(filteredCsvNames);
    } else {
      selectAllCsvsInList(filteredCsvNames);
    }
  };

  const onToggleStudentBulk = () => {
    if (filteredStudentKeys.length === 0) return;
    if (allFilteredStudentsSelected) {
      deselectAllStudentsInList(filteredStudentKeys);
    } else {
      selectAllStudentsInList(filteredStudentKeys);
    }
  };

  const noCsv = csvSelectionCount === 0;
  const noStudents = studentSelectionCount === 0;
  const blocked = noCsv || noStudents;

  const mainRef = useRef<HTMLElement>(null);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      scrollPosRef.current = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    if (blocked) {
      el.scrollTop = 0;
      return;
    }
    el.scrollTop = scrollPosRef.current;
  }, [blocked, statResultsById]);

  const blockedMessage = useMemo(() => {
    if (noCsv && noStudents) {
      return "Please select at least one CSV file and at least one student to run calculations on.";
    }
    if (noCsv) {
      return "Please select at least one CSV file to run calculations on.";
    }
    return "Please select at least one student to run calculations on.";
  }, [noCsv, noStudents]);

  const showResults = !blocked && statResultsById != null;

  const orderedStats = useMemo(() => computeStatsDisplayOrder(), []);

  const dualStatsSidebars =
    inTauri && statResultsById != null;

  return (
    <div
      className={`with-sidebar with-sidebar--stats-wider${inTauri ? " with-sidebar--stats-stable-center" : ""}`}
    >
      <Sidebar
        unloadContentWhenCollapsed
        toggleAriaLabelExpanded="Collapse stats sidebar"
        toggleAriaLabelCollapsed="Expand stats sidebar"
        renderHeader={({ collapsed, toggle }) =>
          collapsed ? (
            <div className="data-sidebar__header-row data-sidebar__header-row--collapsed">
              <button
                type="button"
                className="sidebar__toggle"
                onClick={toggle}
                aria-expanded={false}
                aria-label="Expand stats sidebar"
              >
                <ChevronRight size={18} strokeWidth={2} aria-hidden />
              </button>
            </div>
          ) : (
            <div className="stats-page__sidebar-header">
              <div className="stats-page__tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "csvs"}
                  className={`stats-page__tab${activeTab === "csvs" ? " stats-page__tab--active" : ""}`}
                  onClick={() => setActiveTab("csvs")}
                >
                  <span>CSVs</span>
                  <span className="stats-page__tab-badge">{csvSelectionCount}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "students"}
                  className={`stats-page__tab${activeTab === "students" ? " stats-page__tab--active" : ""}`}
                  onClick={() => setActiveTab("students")}
                >
                  <span>Students</span>
                  <span className="stats-page__tab-badge">
                    {studentSelectionCount}
                  </span>
                </button>
              </div>
              <button
                type="button"
                className="sidebar__toggle stats-page__sidebar-collapse"
                onClick={toggle}
                aria-expanded
                aria-label="Collapse stats sidebar"
              >
                <ChevronLeft size={18} strokeWidth={2} aria-hidden />
              </button>
            </div>
          )
        }
      >
        <div className="data-sidebar__inner">
          <div className="stats-page__sidebar-toolbar-row">
            <input
              type="search"
              className="data-sidebar__search stats-page__sidebar-search--grow"
              placeholder="Search…"
              value={activeTab === "csvs" ? searchCsv : searchStudent}
              onChange={(e) =>
                activeTab === "csvs"
                  ? setSearchCsv(e.target.value)
                  : setSearchStudent(e.target.value)
              }
              disabled={!inTauri || loading}
              aria-label={
                activeTab === "csvs"
                  ? "Search CSVs by display or file name"
                  : "Search students by name"
              }
            />
            <button
              type="button"
              className="btn stats-sidebar__bulk stats-page__sidebar-bulk-shrink"
              disabled={
                !inTauri ||
                loading ||
                busy ||
                (activeTab === "csvs"
                  ? filteredCsv.length === 0
                  : filteredStudents.length === 0)
              }
              onClick={
                activeTab === "csvs" ? onToggleCsvBulk : onToggleStudentBulk
              }
            >
              {activeTab === "csvs"
                ? allFilteredCsvSelected
                  ? "Deselect All"
                  : "Select All"
                : allFilteredStudentsSelected
                  ? "Deselect All"
                  : "Select All"}
            </button>
          </div>
          <div className="data-sidebar__list-wrap">
            {!inTauri ? (
              <p className="data-sidebar__status">
                Open in Tauri to load CSVs.
              </p>
            ) : loading ? (
              <p className="data-sidebar__status">Loading…</p>
            ) : activeTab === "csvs" ? (
              filteredCsv.length === 0 ? (
                <p className="data-sidebar__status">
                  {rows.length === 0
                    ? "No CSVs yet. Upload on the Files page."
                    : "No matches."}
                </p>
              ) : (
                <ul className="data-sidebar__list">
                  {filteredCsv.map((r) => (
                    <li key={r.fileName}>
                      <label className="stats-csv-item">
                        <input
                          type="checkbox"
                          className="stats-csv-item__check"
                          checked={selectedFileNames.has(r.fileName)}
                          disabled={busy}
                          onChange={() => toggleFile(r.fileName)}
                          aria-label={`Include ${r.displayName} in statistics`}
                        />
                        <span className="stats-csv-item__body">
                          <span className="data-csv-item__title">
                            {r.displayName}
                          </span>
                          <span
                            className="data-csv-item__meta"
                            title={r.fileName}
                          >
                            {r.fileName}
                          </span>
                          <span className="data-csv-item__date">
                            Uploaded: {formatUploadDate(r.uploadedAt)}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )
            ) : csvSelectionCount === 0 ? (
              <p className="data-sidebar__status">
                Select at least one CSV to see students in this list.
              </p>
            ) : !selectedCsvDatasetsReady ? (
              <p className="data-sidebar__status">Loading students…</p>
            ) : studentsInSelectedCsvs.length === 0 ? (
              <p className="data-sidebar__status">
                No students found in selected CSVs.
              </p>
            ) : filteredStudents.length === 0 ? (
              <p className="data-sidebar__status">No matches.</p>
            ) : (
              <ul className="data-sidebar__list">
                {filteredStudents.map((s) => (
                  <li key={s.key}>
                    <label className="stats-student-item">
                      <input
                        type="checkbox"
                        className="stats-csv-item__check"
                        checked={selectedStudentKeys.has(s.key)}
                        disabled={busy}
                        onChange={() => toggleStudent(s.key)}
                        aria-label={`Include ${s.label} in statistics`}
                      />
                      <span className="stats-student-item__name">{s.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Sidebar>
      <main
        ref={mainRef}
        className="with-sidebar__main stats-page__main stats-page__main--scroll"
      >
        {!inTauri ? (
          <div className="stats-page__main-inner stats-page__body-pad">
            <p className="stats-page__placeholder">
              Run with <code>bun run tauri dev</code> to use statistics.
            </p>
          </div>
        ) : (
            <div
              className={`stats-page__stable-center-slot stats-page__rail-width${dualStatsSidebars ? " stats-page__rail-width--dual" : ""}`}
            >
              <div className="stats-page__main-inner stats-page__main-stack">
                <div className="stats-page__below-strip stats-page__body-pad">
                  {blocked ? (
                    <p className="stats-page__placeholder">{blockedMessage}</p>
                  ) : !showResults ? (
                    <p className="stats-page__placeholder">Preparing statistics…</p>
                  ) : (
                    <div className="stats-page__results-centered">
                      <div className="stats-page__findings">
                        {orderedStats.map((def) => {
                          const run = statResultsById.get(def.id);
                          const summaryText =
                            run == null
                              ? "No run yet."
                              : run.contributingFiles.length === 0
                                ? "No rows contributed (missing columns, empty required cells, or CSVs still loading)."
                                : run.summary;
                          return (
                            <div
                              key={def.id}
                              id={`stat-section-${def.id}`}
                              className="stats-page__finding stats-page__finding-scroll-target"
                            >
                              <span className="stats-page__finding-label">
                                {run?.label ?? def.label}
                              </span>
                              <p className="stats-page__finding-text">
                                {summaryText}
                              </p>
                              {run?.data != null &&
                              run.contributingFiles.length > 0 ? (
                                <div className="stats-page__finding-chart-wrap">
                                  <StatVisualization
                                    statId={def.id}
                                    data={run.data}
                                  />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {inTauri && !blocked && isStatsCalculating ? (
                  <div
                    className="stats-page__loading-overlay"
                    aria-live="polite"
                    aria-busy
                  >
                    <Loader2
                      className="stats-page__loading-spinner"
                      size={36}
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="stats-page__loading-sr">Calculating…</span>
                  </div>
                ) : null}
              </div>
            </div>
        )}
      </main>
      {inTauri && statResultsById != null ? (
        <Sidebar
          position="end"
          unloadContentWhenCollapsed
          defaultCollapsed
          toggleAriaLabelExpanded="Collapse table of contents"
          toggleAriaLabelCollapsed="Expand table of contents"
          renderHeader={({ collapsed, toggle }) =>
            collapsed ? (
              <div className="data-sidebar__header-row data-sidebar__header-row--collapsed">
                <button
                  type="button"
                  className="sidebar__toggle"
                  onClick={toggle}
                  aria-expanded={false}
                  aria-label="Expand table of contents"
                >
                  <ChevronLeft size={18} strokeWidth={2} aria-hidden />
                </button>
              </div>
            ) : (
              <div className="stats-page__toc-sidebar-header">
                <button
                  type="button"
                  className="sidebar__toggle stats-page__toc-sidebar-collapse"
                  onClick={toggle}
                  aria-expanded
                  aria-label="Collapse table of contents"
                >
                  <ChevronRight size={18} strokeWidth={2} aria-hidden />
                </button>
                <h2 className="stats-page__toc-sidebar-title">
                  Table of Contents
                </h2>
              </div>
            )
          }
        >
          <StatsPageToc defs={orderedStats} statResultsById={statResultsById} />
        </Sidebar>
      ) : null}
    </div>
  );
}

export default function StatsPage() {
  return <StatsPageInner />;
}
