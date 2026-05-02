import { FIELDS } from "./fields";
import {
  computeAvgTotalImprovement,
  type TrackResult,
} from "./avgTotalImprovement";

export interface StatConfig {
  id: string;
  label: string;
  /** Column headers that must exist on the CSV (and as keys on each row). */
  requiredFields: string[];
  /**
   * Per row, these headers must be non-empty after trim for the row to be kept.
   * Defaults to `requiredFields` when omitted (all required columns must be filled).
   */
  requiredNonEmptyFields?: string[];
  calculate: (rows: Record<string, string>[]) => number | string | null;
}

export const STATS: StatConfig[] = [
  {
    id: "avg_total_improvement_baseline_to_latest",
    label: "Average TOTAL improvement (baseline → most recent test)",
    requiredFields: [
      FIELDS.LAST_NAME,
      FIELDS.FIRST_NAME,
      FIELDS.TEST,
      FIELDS.BASELINE,
      FIELDS.TEST_DATE,
      FIELDS.TOTAL,
    ],
    requiredNonEmptyFields: [
      FIELDS.LAST_NAME,
      FIELDS.FIRST_NAME,
      FIELDS.TEST_DATE,
    ],
    calculate: (rows) => {
      const r = computeAvgTotalImprovement(rows);
      if (r == null) {
        return (
          "No qualifying students on any track: per TEST type (ACT / SAT / PSAT), " +
          "need a baseline row (non-empty BASELINE) and at least one later " +
          "TEST DATE with valid TOTAL scores on both rows."
        );
      }
      const fmt = (label: string, t: TrackResult | null) =>
        t == null
          ? `${label}: no qualifying students.`
          : `${label}: ${t.avg.toFixed(2)} points (${t.studentCount} students).`;
      return `${fmt("ACT", r.act)} ${fmt("SAT", r.sat)} ${fmt("PSAT", r.psat)}`;
    },
  },
];
