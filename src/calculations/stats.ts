import { FIELDS } from "./fields";

export interface StatConfig {
  id: string;
  label: string;
  /** CSV header strings; use values from {@link FIELDS}. */
  requiredFields: string[];
  calculate: (rows: Record<string, string>[]) => number | string | null;
}

export const STATS: StatConfig[] = [
  {
    id: "placeholder-row-count",
    label: "Placeholder: row count (requires date)",
    requiredFields: [FIELDS.DATE],
    calculate: (rows) => rows.length,
  },
  {
    id: "placeholder-revenue-sum",
    label: "Placeholder: sum of revenue",
    requiredFields: [FIELDS.DATE, FIELDS.REVENUE],
    calculate: (rows) =>
      rows.reduce((sum, row) => sum + Number(row[FIELDS.REVENUE] ?? 0), 0),
  },
  {
    id: "placeholder-label",
    label: "Placeholder: static label when data exists",
    requiredFields: [FIELDS.UNITS],
    calculate: () => "ok",
  },
];
