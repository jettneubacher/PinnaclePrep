import { FIELDS } from "./fields";

/** Normalize parsed rows to string cells for the stats pipeline. */
export function rowsToStringRecords(
  rows: Record<string, unknown>[],
): Record<string, string>[] {
  return rows.map((row) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = v == null ? "" : String(v);
    }
    return out;
  });
}

export function studentKeyFromRow(row: Record<string, string>): string | null {
  const last = (row[FIELDS.LAST_NAME] ?? "").trim();
  const first = (row[FIELDS.FIRST_NAME] ?? "").trim();
  if (last === "" && first === "") return null;
  return `${last}\0${first}`;
}

export function studentLabelFromKey(key: string): string {
  const [last, first] = key.split("\0");
  return `${last}, ${first}`;
}

/** Unique students across the given CSVs (sorted file order, deduped, labels sorted). */
export function collectStudentsFromSelectedFiles(
  fileNames: readonly string[],
  datasets: Record<string, { rows?: Record<string, unknown>[] } | undefined>,
): { key: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const fileName of [...fileNames].sort((a, b) => a.localeCompare(b))) {
    const rawRows = datasets[fileName]?.rows;
    if (!rawRows?.length) continue;
    for (const row of rowsToStringRecords(rawRows)) {
      const key = studentKeyFromRow(row);
      if (key && !seen.has(key)) seen.set(key, studentLabelFromKey(key));
    }
  }
  return [...seen.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Unique students across all loaded library CSVs (order: sorted by display name). */
export function collectGlobalStudentsFromDatasets(
  libraryRows: { fileName: string }[],
  datasets: Record<string, { rows?: Record<string, unknown>[] } | undefined>,
): { key: string; label: string }[] {
  return collectStudentsFromSelectedFiles(
    libraryRows.map((r) => r.fileName),
    datasets,
  );
}

export function filterRowsToStudentKeys(
  rows: Record<string, string>[],
  includeKeys: ReadonlySet<string>,
): Record<string, string>[] {
  if (includeKeys.size === 0) return [];
  return rows.filter((row) => {
    const key = studentKeyFromRow(row);
    return key != null && includeKeys.has(key);
  });
}
