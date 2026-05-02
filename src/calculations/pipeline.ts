import type { StatConfig } from "./stats";

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
  requiredFields: string[],
): Record<string, string>[] {
  return rows.filter((row) =>
    requiredFields.every((f) => {
      const v = row[f];
      return v != null && String(v).trim() !== "";
    }),
  );
}

/**
 * Runs each stat against the given CSVs. For every stat, only CSVs that include
 * all required columns are considered; rows missing any required value are dropped.
 * Merged rows from qualifying files are passed to `calculate`.
 */
export function runStats(csvs: CsvInput[], stats: StatConfig[]): StatRunResult[] {
  return stats.map((stat) => {
    const withColumns = csvs.filter((c) =>
      csvHasAllColumns(c.rows, stat.requiredFields),
    );

    const perFile = withColumns.map((c) => ({
      fileName: c.fileName,
      rows: filterRowsWithRequired(c.rows, stat.requiredFields),
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
