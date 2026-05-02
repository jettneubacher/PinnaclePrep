import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import Sidebar from "../../components/Sidebar";
import { useCsvData } from "../../context/CsvDataContext";
import { useCsvLibrary } from "../../context/CsvLibraryContext";
import { DataPageProvider, useDataPage } from "../../context/DataPageContext";
import { formatUploadDate } from "../../lib/formatUploadedEst";
import type { CsvMetadata } from "../../lib/csvStorage";
import DataCsvTable from "./DataCsvTable";

function filterRows(rows: CsvMetadata[], query: string): CsvMetadata[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.displayName.toLowerCase().includes(q) ||
      r.fileName.toLowerCase().includes(q),
  );
}

function DataPageInner() {
  const { rows, loading, busy } = useCsvLibrary();
  const { datasets, loadingByFile, errorsByFile } = useCsvData();
  const { selectedFileName, setSelectedFileName } = useDataPage();
  const [search, setSearch] = useState("");
  const inTauri = isTauri();

  const filtered = useMemo(
    () => filterRows(rows, search),
    [rows, search],
  );

  const selected = useMemo(
    () => rows.find((r) => r.fileName === selectedFileName) ?? null,
    [rows, selectedFileName],
  );

  const dataset =
    selectedFileName != null ? datasets[selectedFileName] : undefined;
  const dataLoading =
    selectedFileName != null ? !!loadingByFile[selectedFileName] : false;
  const dataError =
    selectedFileName != null ? errorsByFile[selectedFileName] : undefined;

  useEffect(() => {
    if (
      selectedFileName &&
      !rows.some((r) => r.fileName === selectedFileName)
    ) {
      setSelectedFileName(null);
    }
  }, [rows, selectedFileName, setSelectedFileName]);

  useEffect(() => {
    if (
      selectedFileName &&
      !filtered.some((r) => r.fileName === selectedFileName)
    ) {
      setSelectedFileName(null);
    }
  }, [filtered, selectedFileName, setSelectedFileName]);

  return (
    <div className="with-sidebar">
      <Sidebar
        toggleAriaLabelExpanded="Collapse data sidebar"
        toggleAriaLabelCollapsed="Expand data sidebar"
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
                collapsed ? "Expand data sidebar" : "Collapse data sidebar"
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
                    <button
                      type="button"
                      className={`data-csv-item${
                        selectedFileName === r.fileName
                          ? " data-csv-item--selected"
                          : ""
                      }`}
                      onClick={() => setSelectedFileName(r.fileName)}
                      disabled={busy}
                    >
                      <span className="data-csv-item__title">
                        {r.displayName}
                      </span>
                      <span className="data-csv-item__meta" title={r.fileName}>
                        {r.fileName}
                      </span>
                      <span className="data-csv-item__date">
                        {formatUploadDate(r.uploadedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Sidebar>
      <main className="with-sidebar__main data-main">
        {!inTauri ? (
          <p className="data-main__empty data-main__top-pad">
            Run with <code>bun run tauri dev</code> to browse stored CSVs.
          </p>
        ) : !selected ? (
          <p className="data-main__empty data-main__top-pad">
            Select a CSV from the list to view its contents.
          </p>
        ) : (
          <>
            <div className="data-main__header">
              <h1 className="data-main__title-row">
                <span className="data-main__title">{selected.displayName}</span>
                <span className="data-main__subtitle" title={selected.fileName}>
                  {selected.fileName}
                </span>
              </h1>
            </div>
            <div className="data-main__scroll">
              {dataError ? (
                <p className="data-main__error" role="alert">
                  {dataError}
                </p>
              ) : dataLoading ? (
                <p className="data-main__status">Loading CSV…</p>
              ) : dataset ? (
                <>
                  {dataset.parseErrors.length > 0 ? (
                    <p className="data-main__parse-warn" role="status">
                      Papa Parse reported {dataset.parseErrors.length} issue
                      {dataset.parseErrors.length === 1 ? "" : "s"}; some
                      values may be incomplete.
                    </p>
                  ) : null}
                  {dataset.rows.length === 0 &&
                  !(dataset.fields?.length ?? 0) ? (
                    <p className="data-main__empty">This file has no rows.</p>
                  ) : (
                    <DataCsvTable dataset={dataset} />
                  )}
                </>
              ) : (
                <p className="data-main__empty">No data loaded.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function DataPage() {
  return (
    <DataPageProvider>
      <DataPageInner />
    </DataPageProvider>
  );
}
