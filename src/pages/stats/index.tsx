import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import Sidebar from "../../components/Sidebar";
import { useCsvLibrary } from "../../context/CsvLibraryContext";
import { StatsPageProvider, useStatsPage } from "../../context/StatsPageContext";
import { formatUploadDate } from "../../lib/formatUploadedEst";
import type { CsvMetadata } from "../../lib/csvStorage";

function filterRows(rows: CsvMetadata[], query: string): CsvMetadata[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.displayName.toLowerCase().includes(q) ||
      r.fileName.toLowerCase().includes(q),
  );
}

function StatsPageInner() {
  const { rows, loading, busy } = useCsvLibrary();
  const {
    selectedFileNames,
    selectionCount,
    toggleFile,
    selectAllInList,
    deselectAllInList,
    lastCalculated,
    runCalculate,
  } = useStatsPage();
  const [search, setSearch] = useState("");
  const inTauri = isTauri();

  const filtered = useMemo(
    () => filterRows(rows, search),
    [rows, search],
  );

  const filteredFileNames = useMemo(
    () => filtered.map((r) => r.fileName),
    [filtered],
  );

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((r) => selectedFileNames.has(r.fileName));

  const onToggleBulk = () => {
    if (filteredFileNames.length === 0) return;
    if (allFilteredSelected) {
      deselectAllInList(filteredFileNames);
    } else {
      selectAllInList(filteredFileNames);
    }
  };

  return (
    <div className="with-sidebar">
      <Sidebar
        toggleAriaLabelExpanded="Collapse stats sidebar"
        toggleAriaLabelCollapsed="Expand stats sidebar"
        renderHeader={({ collapsed, toggle }) => (
          <div
            className={`data-sidebar__header-row${
              collapsed ? " data-sidebar__header-row--collapsed" : ""
            }`}
          >
            {!collapsed ? (
              <input
                type="search"
                className="data-sidebar__search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!inTauri || loading}
                aria-label="Search CSVs by display or file name"
              />
            ) : null}
            <button
              type="button"
              className="sidebar__toggle"
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-label={
                collapsed ? "Expand stats sidebar" : "Collapse stats sidebar"
              }
            >
              {collapsed ? (
                <ChevronRight size={18} strokeWidth={2} aria-hidden />
              ) : (
                <ChevronLeft size={18} strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        )}
      >
        <div className="data-sidebar__inner">
          <div className="stats-sidebar__toolbar">
            <button
              type="button"
              className="btn stats-sidebar__bulk"
              disabled={!inTauri || loading || filtered.length === 0 || busy}
              onClick={onToggleBulk}
            >
              {allFilteredSelected ? "Deselect All" : "Select All"}
            </button>
            <button
              type="button"
              className="btn btn--primary stats-sidebar__calculate"
              disabled={!inTauri || loading || selectionCount === 0 || busy}
              onClick={() => runCalculate()}
            >
              Calculate
            </button>
          </div>
          <div className="data-sidebar__list-wrap">
            {!inTauri ? (
              <p className="data-sidebar__status">
                Open in Tauri to load CSVs.
              </p>
            ) : loading ? (
              <p className="data-sidebar__status">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="data-sidebar__status">
                {rows.length === 0
                  ? "No CSVs yet. Upload on the Files page."
                  : "No matches."}
              </p>
            ) : (
              <ul className="data-sidebar__list">
                {filtered.map((r) => (
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
                          {formatUploadDate(r.uploadedAt)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Sidebar>
      <main className="with-sidebar__main stats-page__main">
        {!inTauri ? (
          <p className="stats-page__placeholder">
            Run with <code>bun run tauri dev</code> to use statistics.
          </p>
        ) : lastCalculated == null ? (
          <p className="stats-page__placeholder">
            Select CSV file(s) and click &quot;Calculate&quot; to generate
            statistics.
          </p>
        ) : (
          <div className="stats-page__results">
            <h2 className="stats-page__results-title">Last calculation</h2>
            <ul className="stats-page__results-list">
              {lastCalculated.map((e) => (
                <li key={e.fileName} className="stats-page__results-item">
                  <span className="stats-page__results-name">
                    {e.displayName}
                  </span>
                  <span
                    className="stats-page__results-file"
                    title={e.fileName}
                  >
                    {e.fileName}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StatsPage() {
  return (
    <StatsPageProvider>
      <StatsPageInner />
    </StatsPageProvider>
  );
}
