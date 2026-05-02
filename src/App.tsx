import { useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { useCsvLibrary } from "./context/CsvLibraryContext";
import type { CsvMetadata } from "./lib/csvStorage";
import "./App.css";

/** Upload time in US Eastern (`America/New_York`): date, hour:minute, and EST/EDT (no seconds). */
function formatUploadedEst(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

export default function App() {
  const {
    rows,
    loading,
    error,
    busy,
    refresh,
    uploadCsvFile,
    deleteCsv,
    renameCsv,
  } = useCsvLibrary();

  const fileRef = useRef<HTMLInputElement>(null);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  async function onPickFile(file: File | null) {
    if (!file || !isTauri()) return;
    try {
      await uploadCsvFile(file);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      /* error surfaced via context */
    }
  }

  async function onDelete(meta: CsvMetadata) {
    try {
      await deleteCsv(meta);
      if (editingFileName === meta.fileName) {
        setEditingFileName(null);
      }
    } catch {
      /* error surfaced via context */
    }
  }

  function startRename(meta: CsvMetadata) {
    setEditingFileName(meta.fileName);
    setEditDraft(meta.displayName);
  }

  function cancelRename() {
    setEditingFileName(null);
    setEditDraft("");
  }

  async function commitRename(fileName: string) {
    try {
      await renameCsv(fileName, editDraft);
      setEditingFileName(null);
      setEditDraft("");
    } catch {
      /* error surfaced via context */
    }
  }

  const inTauri = isTauri();

  return (
    <main className="app">
      <h1>PP Stats</h1>

      {!inTauri && (
        <p className="banner">
          Run with <code>bun run tauri dev</code> so CSVs can be saved to app data.
        </p>
      )}

      {error ? <p className="error">{error}</p> : null}

      <section className="section">
        <h2>Upload</h2>
        <p className="hint">Choose a .csv file to copy it into this app&apos;s storage.</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          disabled={!inTauri || busy}
          onChange={(e) => void onPickFile(e.target.files?.item(0) ?? null)}
        />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Your CSVs</h2>
          {inTauri ? (
            <button
              type="button"
              className="btn linkish"
              disabled={busy || loading}
              onClick={() => void refresh()}
            >
              Refresh list
            </button>
          ) : null}
        </div>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="muted">No files yet. Upload one above.</p>
        ) : (
          <ul className="csv-list">
            {rows.map((r) => (
              <li key={r.fileName} className="csv-row">
                <div className="csv-main">
                  {editingFileName === r.fileName ? (
                    <div className="rename-row">
                      <input
                        className="rename-input"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        disabled={busy}
                        autoFocus
                        aria-label="Display name"
                      />
                      <button
                        type="button"
                        className="btn primary"
                        disabled={busy}
                        onClick={() => void commitRename(r.fileName)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={busy}
                        onClick={cancelRename}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="csv-title">{r.displayName}</span>
                      <span className="csv-meta">
                        Uploaded {formatUploadedEst(r.uploadedAt)} ·{" "}
                        <span className="csv-filename" title="Name on disk">
                          {r.fileName}
                        </span>
                      </span>
                    </>
                  )}
                </div>
                {editingFileName !== r.fileName ? (
                  <div className="csv-actions">
                    <button
                      type="button"
                      className="btn"
                      disabled={!inTauri || busy}
                      onClick={() => startRename(r)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      disabled={!inTauri || busy}
                      onClick={() => void onDelete(r)}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
