import { FIELDS } from "../fields";
import type { StatJobResult, StudentAnalyticsContext } from "../functions/contextTypes";

export interface StatConfig {
  id: string;
  label: string;
  /** Column headers that must exist on the CSV (and as keys on each row). */
  requiredFields: string[];
  /**
   * Per row, these headers must be non-empty after trim for the row to be kept.
   * Defaults to `requiredFields` when omitted.
   */
  requiredNonEmptyFields?: string[];
  /** Runs on `StudentAnalyticsContext` built once per merge group in the pipeline. */
  calculate: (ctx: StudentAnalyticsContext) => StatJobResult;
}

/**
 * Headers required for the stats pipeline (must exist on each qualifying CSV).
 * Columns `buildContext` reads that must exist on the CSV header. **MANAGER FIRST
 * SESSION** and **FIRST SESSION** are intentionally omitted: either column may be
 * absent; prep length uses whichever is present (manager wins when both exist), and
 * stays null when neither yields a prep start after scanning.
 */
export const STATS_REQUIRED_FIELDS: string[] = [
  FIELDS.LAST_NAME,
  FIELDS.FIRST_NAME,
  FIELDS.COMPLETION,
  FIELDS.GRAD_YEAR,
  FIELDS.NUM_TESTS,
  FIELDS.TUTORING_HOURS,
  FIELDS.TEST,
  FIELDS.TEST_DATE,
  FIELDS.BASELINE,
  FIELDS.VERBAL,
  FIELDS.MATH,
  FIELDS.TOTAL,
  FIELDS.LAST_SESSION,
  FIELDS.REMOTE_PCT,
].sort((a, b) => a.localeCompare(b));

export const STATS_REQUIRED_NON_EMPTY: string[] = [
  FIELDS.LAST_NAME,
  FIELDS.FIRST_NAME,
  FIELDS.TEST,
  FIELDS.TEST_DATE,
];
