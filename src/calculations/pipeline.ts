import type { CsvDataset } from "../context/CsvDataContext";
import type { StatConfig } from "./stats";

export { STATS } from "./stats";
export type { StatConfig } from "./stats";

export type CsvInput = {
  fileName: string;
  rows: Record<string, string>[];
};

export type StatRunResult = {
  statId: string;
  label: string;
  result: number | string | null;
  contributingFiles: string[];
};

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

/** Build pipeline inputs from in-memory datasets for the given file names (order preserved). */
export function buildCsvInputsFromDatasets(
  fileNames: string[],
  datasets: Record<string, CsvDataset>,
): CsvInput[] {
  const out: CsvInput[] = [];
  for (const fileName of fileNames) {
    const ds = datasets[fileName];
    if (!ds || ds.rows.length === 0) continue;
    out.push({
      fileName,
      rows: rowsToStringRecords(ds.rows),
    });
  }
  return out;
}

function csvHasAllColumns(
  rows: Record<string, string>[],
  requiredFields: string[],
): boolean {
  if (rows.length === 0) return false;
  const keys = new Set(Object.keys(rows[0]));
  return requiredFields.every((f) => keys.has(f));
}

function filterRowsWithRequired(
  rows: Record<string, string>[],
  nonEmptyFields: string[],
): Record<string, string>[] {
  return rows.filter((row) =>
    nonEmptyFields.every((f) => {
      const v = row[f];
      return v != null && String(v).trim() !== "";
    }),
  );
}

/**
 * Runs each stat against the given CSVs. Only CSVs that include every
 * `requiredFields` header are used. Rows are kept when all
 * `requiredNonEmptyFields` (default: `requiredFields`) are non-empty after trim.
 * Merged rows from qualifying files are passed to `calculate`.
 */
export function runStats(csvs: CsvInput[], stats: StatConfig[]): StatRunResult[] {
  return stats.map((stat) => {
    const withColumns = csvs.filter((c) =>
      csvHasAllColumns(c.rows, stat.requiredFields),
    );

    const nonEmpty =
      stat.requiredNonEmptyFields ?? stat.requiredFields;
    const perFile = withColumns.map((c) => ({
      fileName: c.fileName,
      rows: filterRowsWithRequired(c.rows, nonEmpty),
    }));

    const contributing = perFile.filter((p) => p.rows.length > 0);
    const contributingFiles = contributing.map((p) => p.fileName);
    const merged = contributing.flatMap((p) => p.rows);

    if (merged.length === 0) {
      return {
        statId: stat.id,
        label: stat.label,
        result: null,
        contributingFiles: [],
      };
    }

    return {
      statId: stat.id,
      label: stat.label,
      result: stat.calculate(merged),
      contributingFiles,
    };
  });
}
