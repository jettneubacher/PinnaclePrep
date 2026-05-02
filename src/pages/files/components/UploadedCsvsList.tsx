import { useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { useCsvLibrary } from "../../../context/CsvLibraryContext";
import { formatUploadedEst } from "../../../lib/formatUploadedEst";
import type { CsvMetadata } from "../../../lib/csvStorage";
import DeleteConfirmModal from "./DeleteConfirmModal";

export default function UploadedCsvsList() {
  const { rows, loading, busy, refresh, deleteCsv, renameCsv } = useCsvLibrary();
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CsvMetadata | null>(null);
  const inTauri = isTauri();

  function requestDelete(meta: CsvMetadata) {
    setDeleteTarget(meta);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const meta = deleteTarget;
    setDeleteTarget(null);
    void (async () => {
      try {
        await deleteCsv(meta);
        if (editingFileName === meta.fileName) {
          setEditingFileName(null);
        }
      } catch {
        /* error in context */
      }
    })();
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
      /* error in context */
    }
  }

  return (
    <>
      <DeleteConfirmModal
        meta={deleteTarget}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    <section className="files-page__section files-page__section--list">
      <div className="files-page__section-head">
        <h2 className="files-page__h2">Uploaded CSVs</h2>
        {inTauri ? (
          <button
            type="button"
            className="btn btn--primary files-page__refresh"
            disabled={busy || loading}
            onClick={() => void refresh()}
          >
            Refresh
          </button>
        ) : null}
      </div>
      {loading ? (
        <p className="files-page__muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="files-page__muted">No files yet. Add CSVs above.</p>
      ) : (
        <ul className="csv-list">
          {rows.map((r) => (
            <li key={r.fileName} className="csv-row">
              <div className="csv-row__main">
                {editingFileName === r.fileName ? (
                  <div className="csv-row__rename">
                    <input
                      className="csv-row__rename-input"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      disabled={busy}
                      autoFocus
                      aria-label="Display name"
                    />
                    <button
                      type="button"
                      className="btn btn--primary"
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
                    <span className="csv-row__title">{r.displayName}</span>
                    <span className="csv-row__meta">
                      {formatUploadedEst(r.uploadedAt)} ·{" "}
                      <span className="csv-row__filename" title="Name on disk">
                        {r.fileName}
                      </span>
                    </span>
                  </>
                )}
              </div>
              {editingFileName !== r.fileName ? (
                <div className="csv-row__actions">
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
                      className="btn btn--danger"
                      disabled={!inTauri || busy}
                      onClick={() => requestDelete(r)}
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
    </>
  );
}
