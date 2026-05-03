import { FIELDS } from "../fields";
import {
  type StudentAnalyticsContext,
  type StudentRollup,
  type StudentTestBlock,
  TEST_TYPES,
} from "./contextTypes";
import {
  isoDateLocal,
  parseFloatCell,
  parseGradYearFromRow,
  parseIntCell,
  prepWeeksFromIsoDates,
} from "./utils";

export type BuildAnalyticsOptions = {
  /**
   * When LAST SESSION is empty on the latest row, prep length ends on this
   * calendar date (e.g. moment the user ran Calculate).
   */
  calculatedAt?: Date;
};

/** Prep length only when a prep start exists (manager or first session); otherwise null. */
function prepLengthWeeksFromSessions(
  firstSession: string,
  lastSession: string,
  calculatedAt: Date,
): number | null {
  const firstS = firstSession.trim();
  if (firstS === "") return null;
  const lastS = lastSession.trim();
  const endIso = lastS !== "" ? lastS : isoDateLocal(calculatedAt);
  return prepWeeksFromIsoDates(firstS, endIso);
}

function studentNameFromKey(key: string): string {
  const [last, first] = key.split("\0");
  return `${last}, ${first}`;
}

function sortRowsChrono(
  rows: Record<string, string>[],
): Record<string, string>[] {
  return [...rows].sort((a, b) =>
    (a[FIELDS.TEST_DATE] ?? "").localeCompare(b[FIELDS.TEST_DATE] ?? ""),
  );
}

function maxDateRow(
  rows: Record<string, string>[],
): Record<string, string> | null {
  if (rows.length === 0) return null;
  let best = rows[0];
  let bestD = best[FIELDS.TEST_DATE] ?? "";
  for (const r of rows) {
    const d = r[FIELDS.TEST_DATE] ?? "";
    if (d.localeCompare(bestD) > 0) {
      best = r;
      bestD = d;
    }
  }
  return best;
}

function improvementPair(
  baselineRow: Record<string, string>,
  latestRow: Record<string, string>,
  field: string,
): number | null {
  const b = parseIntCell(baselineRow[field]);
  const l = parseIntCell(latestRow[field]);
  if (b == null || l == null) return null;
  return l - b;
}

/**
 * Prep start for one row: **MANAGER FIRST SESSION** if non-empty, else **FIRST SESSION**.
 * Neither required if the other is set; if both empty, this row contributes no prep start.
 */
function prepStartDateFromRow(r: Record<string, string>): string {
  const mgr = (r[FIELDS.MANAGER_FIRST_SESSION] ?? "").trim();
  if (mgr !== "") return mgr;
  return (r[FIELDS.FIRST_SESSION] ?? "").trim();
}

/** Earliest row (chronological) with a non-empty prep start — sessions often repeat or sit on non-latest rows. */
function firstSessionFromTypeRows(
  typeRowsSorted: Record<string, string>[],
): string {
  for (const r of typeRowsSorted) {
    const v = prepStartDateFromRow(r);
    if (v !== "") return v;
  }
  return "";
}

/** Latest row (by sort order) with a non-empty LAST SESSION. */
function lastSessionFromTypeRows(
  typeRowsSorted: Record<string, string>[],
): string {
  for (let i = typeRowsSorted.length - 1; i >= 0; i--) {
    const ls = (typeRowsSorted[i][FIELDS.LAST_SESSION] ?? "").trim();
    if (ls !== "") return ls;
  }
  return "";
}

/** If test-type rows omit sessions, reuse dates from any row for this student (chronological). */
function sessionFieldsFromStudentRows(
  studentRowsSorted: Record<string, string>[],
): { first: string; last: string } {
  return {
    first: firstSessionFromTypeRows(studentRowsSorted),
    last: lastSessionFromTypeRows(studentRowsSorted),
  };
}

/**
 * One pass over merged CSV rows: per-student rollups and per-(student, test type) blocks.
 * Baseline / latest-after-baseline follow existing product rules; attributes like tutoring
 * and remote % come from the latest row for that test type.
 */
export function buildStudentTestAnalytics(
  rows: Record<string, string>[],
  options?: BuildAnalyticsOptions,
): StudentAnalyticsContext {
  const calculatedAt = options?.calculatedAt ?? new Date();
  const byStudent = new Map<string, Record<string, string>[]>();

  for (const row of rows) {
    const last = (row[FIELDS.LAST_NAME] ?? "").trim();
    const first = (row[FIELDS.FIRST_NAME] ?? "").trim();
    if (last === "" && first === "") continue;
    const key = `${last}\0${first}`;
    const list = byStudent.get(key);
    if (list) list.push(row);
    else byStudent.set(key, [row]);
  }

  const blocks: StudentTestBlock[] = [];
  const rollups: StudentRollup[] = [];

  for (const [studentKey, allRows] of byStudent) {
    const studentName = studentNameFromKey(studentKey);
    const latestRowGlobal = maxDateRow(allRows);

    rollups.push({
      studentKey,
      studentName,
      latestRowGlobal,
      completion: (latestRowGlobal?.[FIELDS.COMPLETION] ?? "").trim(),
      gradYear: parseGradYearFromRow(latestRowGlobal),
    });

    for (const testType of TEST_TYPES) {
      const typeRows = sortRowsChrono(
        allRows.filter((r) => (r[FIELDS.TEST] ?? "").trim() === testType),
      );
      if (typeRows.length === 0) continue;

      const latestRow = typeRows[typeRows.length - 1];
      const baselineCandidates = typeRows.filter(
        (r) => (r[FIELDS.BASELINE] ?? "").trim() !== "",
      );
      baselineCandidates.sort((a, b) =>
        (a[FIELDS.TEST_DATE] ?? "").localeCompare(b[FIELDS.TEST_DATE] ?? ""),
      );
      const baselineRow =
        baselineCandidates.length > 0 ? baselineCandidates[0] : null;
      const baselineDate = baselineRow
        ? (baselineRow[FIELDS.TEST_DATE] ?? "").trim()
        : "";

      let latestAfterBaselineRow: Record<string, string> | null = null;
      if (baselineRow && baselineDate !== "") {
        const subsequent = typeRows.filter(
          (r) => (r[FIELDS.TEST_DATE] ?? "").localeCompare(baselineDate) > 0,
        );
        latestAfterBaselineRow =
          subsequent.length > 0 ? maxDateRow(subsequent) : null;
      }

      let improvementTotal: number | null = null;
      let improvementVerbal: number | null = null;
      let improvementMath: number | null = null;
      let baselineTotal: number | null = null;
      let latestTotal: number | null = null;
      let baselineVerbal: number | null = null;
      let latestVerbal: number | null = null;
      let baselineMath: number | null = null;
      let latestMath: number | null = null;

      if (baselineRow && latestAfterBaselineRow) {
        baselineTotal = parseIntCell(baselineRow[FIELDS.TOTAL]);
        latestTotal = parseIntCell(latestAfterBaselineRow[FIELDS.TOTAL]);
        baselineVerbal = parseIntCell(baselineRow[FIELDS.VERBAL]);
        latestVerbal = parseIntCell(latestAfterBaselineRow[FIELDS.VERBAL]);
        baselineMath = parseIntCell(baselineRow[FIELDS.MATH]);
        latestMath = parseIntCell(latestAfterBaselineRow[FIELDS.MATH]);
        improvementTotal = improvementPair(
          baselineRow,
          latestAfterBaselineRow,
          FIELDS.TOTAL,
        );
        improvementVerbal = improvementPair(
          baselineRow,
          latestAfterBaselineRow,
          FIELDS.VERBAL,
        );
        improvementMath = improvementPair(
          baselineRow,
          latestAfterBaselineRow,
          FIELDS.MATH,
        );
      }

      const progression: { testDate: string; total: number }[] = [];
      for (const r of typeRows) {
        const d = (r[FIELDS.TEST_DATE] ?? "").trim();
        const t = parseIntCell(r[FIELDS.TOTAL]);
        if (d !== "" && t != null) progression.push({ testDate: d, total: t });
      }

      let firstS = firstSessionFromTypeRows(typeRows);
      let lastS = lastSessionFromTypeRows(typeRows);
      if (firstS === "" || lastS === "") {
        const any = sessionFieldsFromStudentRows(sortRowsChrono(allRows));
        if (firstS === "") firstS = any.first;
        if (lastS === "") lastS = any.last;
      }
      const prepLengthWeeks = prepLengthWeeksFromSessions(
        firstS,
        lastS,
        calculatedAt,
      );

      blocks.push({
        studentKey,
        studentName,
        testType,
        rowsChrono: typeRows,
        baselineRow,
        latestRow,
        latestAfterBaselineRow,
        improvementTotal,
        improvementVerbal,
        improvementMath,
        baselineTotal,
        latestTotal,
        baselineVerbal,
        latestVerbal,
        baselineMath,
        latestMath,
        progression,
        tutoringHours: parseFloatCell(latestRow[FIELDS.TUTORING_HOURS]),
        remotePct: parseIntCell(latestRow[FIELDS.REMOTE_PCT]),
        gradYear: parseGradYearFromRow(latestRow),
        firstSession: firstS,
        lastSession: lastS,
        prepLengthWeeks,
        numTests: parseIntCell(latestRow[FIELDS.NUM_TESTS]),
        completion: (latestRow[FIELDS.COMPLETION] ?? "").trim(),
      });
    }
  }

  return { blocks, rollups, mergedRowCount: rows.length };
}
