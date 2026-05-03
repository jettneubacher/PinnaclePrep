import type { CsvDataset } from "../context/CsvDataContext";
import {
  filterRowsToStudentKeys,
  rowsToStringRecords,
} from "./csvRows";
import type { StatConfig } from "./stats";
import { buildStudentTestAnalytics } from "./functions/buildContext";

export { rowsToStringRecords } from "./csvRows";
export {
  collectGlobalStudentsFromDatasets,
  collectStudentsFromSelectedFiles,
  studentKeyFromRow,
  studentLabelFromKey,
} from "./csvRows";

export { STATS } from "./stats";
export type { StatConfig } from "./stats";

export type CsvInput = {
  fileName: string;
  rows: Record<string, string>[];
};

export type StatRunResult = {
  statId: string;
  label: string;
  summary: string;
  data: unknown;
  contributingFiles: string[];
};

/** Students present in merged data after last run (for filter UI). */
export type StatsAnalyticsMeta = {
  students: { key: string; label: string }[];
};

export type RunStatsOptions = {
  /** Passed into prep-length when LAST SESSION is blank (Calculate click time). */
  calculatedAt?: Date;
  /** If set, merged rows are limited to these student keys (`last\\0first`). */
  includeStudentKeys?: ReadonlySet<string>;
};

export type RunStatsOutput = {
  results: StatRunResult[];
  analyticsMeta: StatsAnalyticsMeta | null;
};

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

function statMergeSignature(stat: StatConfig): string {
  const nonEmpty = stat.requiredNonEmptyFields ?? stat.requiredFields;
  return JSON.stringify({
    r: [...stat.requiredFields].sort(),
    n: [...nonEmpty].sort(),
  });
}

function mergeForStat(csvs: CsvInput[], stat: StatConfig) {
  const withColumns = csvs.filter((c) =>
    csvHasAllColumns(c.rows, stat.requiredFields),
  );
  const nonEmpty = stat.requiredNonEmptyFields ?? stat.requiredFields;
  const perFile = withColumns.map((c) => ({
    fileName: c.fileName,
    rows: filterRowsWithRequired(c.rows, nonEmpty),
  }));
  const contributing = perFile.filter((p) => p.rows.length > 0);
  const contributingFiles = contributing.map((p) => p.fileName);
  const merged = contributing.flatMap((p) => p.rows);
  return { contributingFiles, merged };
}

function metaFromContext(
  ctx: ReturnType<typeof buildStudentTestAnalytics>,
): StatsAnalyticsMeta {
  const students = ctx.rollups
    .map((r) => ({ key: r.studentKey, label: r.studentName }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return { students };
}

/**
 * Runs each stat. Stats that share the same `requiredFields` /
 * `requiredNonEmptyFields` share one merged row set and one
 * `buildStudentTestAnalytics` pass.
 */
export function runStats(
  csvs: CsvInput[],
  stats: StatConfig[],
  options?: RunStatsOptions,
): RunStatsOutput {
  const calculatedAt = options?.calculatedAt ?? new Date();
  const bySig = new Map<string, StatConfig[]>();
  for (const stat of stats) {
    const sig = statMergeSignature(stat);
    const list = bySig.get(sig);
    if (list) list.push(stat);
    else bySig.set(sig, [stat]);
  }

  const outById = new Map<string, StatRunResult>();
  let analyticsMeta: StatsAnalyticsMeta | null = null;

  for (const group of bySig.values()) {
    const lead = group[0];
    const { contributingFiles, merged: mergedAll } = mergeForStat(csvs, lead);
    const merged =
      options?.includeStudentKeys != null &&
      options.includeStudentKeys.size > 0
        ? filterRowsToStudentKeys(mergedAll, options.includeStudentKeys)
        : mergedAll;
    const ctx = buildStudentTestAnalytics(merged, { calculatedAt });

    if (analyticsMeta == null) {
      analyticsMeta = metaFromContext(ctx);
    }

    for (const stat of group) {
      if (merged.length === 0) {
        outById.set(stat.id, {
          statId: stat.id,
          label: stat.label,
          summary:
            "No rows contributed (missing columns, empty required cells, or CSVs still loading).",
          data: null,
          contributingFiles,
        });
        continue;
      }

      const { summary, data } = stat.calculate(ctx);
      outById.set(stat.id, {
        statId: stat.id,
        label: stat.label,
        summary,
        data,
        contributingFiles,
      });
    }
  }

  const results = stats.map((s) => outById.get(s.id)!);
  return { results, analyticsMeta };
}
