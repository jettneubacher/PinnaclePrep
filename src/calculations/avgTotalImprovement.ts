import { FIELDS } from "./fields";

export type TrackResult = {
  avg: number;
  studentCount: number;
};

export type AvgTotalImprovementResult = {
  act: TrackResult | null;
  sat: TrackResult | null;
  psat: TrackResult | null;
};

/**
 * Baseline → most recent improvement on a single test track (rows already
 * filtered to one TEST type). Returns null if this student does not qualify.
 */
function improvementForTrack(
  rows: Record<string, string>[],
): number | null {
  const baselineRows = rows.filter(
    (r) => (r[FIELDS.BASELINE] ?? "").trim() !== "",
  );
  if (baselineRows.length === 0) return null;

  baselineRows.sort((a, b) =>
    (a[FIELDS.TEST_DATE] ?? "").localeCompare(b[FIELDS.TEST_DATE] ?? ""),
  );
  const baselineRow = baselineRows[0];
  const baselineDate = baselineRow[FIELDS.TEST_DATE] ?? "";
  const baselineTotal = parseInt(
    String(baselineRow[FIELDS.TOTAL] ?? "").trim(),
    10,
  );
  if (!Number.isFinite(baselineTotal)) return null;

  const subsequent = rows.filter(
    (r) => (r[FIELDS.TEST_DATE] ?? "").localeCompare(baselineDate) > 0,
  );
  if (subsequent.length === 0) return null;

  let mostRecent = subsequent[0];
  let mostDate = mostRecent[FIELDS.TEST_DATE] ?? "";
  for (const r of subsequent) {
    const d = r[FIELDS.TEST_DATE] ?? "";
    if (d.localeCompare(mostDate) > 0) {
      mostRecent = r;
      mostDate = d;
    }
  }

  const recentTotal = parseInt(
    String(mostRecent[FIELDS.TOTAL] ?? "").trim(),
    10,
  );
  if (!Number.isFinite(recentTotal)) return null;

  return recentTotal - baselineTotal;
}

function averageTrack(improvements: number[]): TrackResult | null {
  if (improvements.length === 0) return null;
  const sum = improvements.reduce((a, b) => a + b, 0);
  return {
    avg: sum / improvements.length,
    studentCount: improvements.length,
  };
}

/**
 * Per student (LAST + FIRST), separately for TEST === "ACT", "SAT", and "PSAT":
 * baseline = non-empty BASELINE after trim among that test type; if several,
 * earliest TEST DATE; need at least one later row of the same type; most recent
 * by TEST DATE. Improvement = recent TOTAL − baseline TOTAL. Other TEST values
 * are ignored.
 */
export function computeAvgTotalImprovement(
  rows: Record<string, string>[],
): AvgTotalImprovementResult | null {
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

  const actImprovements: number[] = [];
  const satImprovements: number[] = [];
  const psatImprovements: number[] = [];

  for (const group of byStudent.values()) {
    const test = (r: Record<string, string>) =>
      (r[FIELDS.TEST] ?? "").trim();

    const actDelta = improvementForTrack(
      group.filter((r) => test(r) === "ACT"),
    );
    if (actDelta != null) actImprovements.push(actDelta);

    const satDelta = improvementForTrack(
      group.filter((r) => test(r) === "SAT"),
    );
    if (satDelta != null) satImprovements.push(satDelta);

    const psatDelta = improvementForTrack(
      group.filter((r) => test(r) === "PSAT"),
    );
    if (psatDelta != null) psatImprovements.push(psatDelta);
  }

  const act = averageTrack(actImprovements);
  const sat = averageTrack(satImprovements);
  const psat = averageTrack(psatImprovements);
  if (act == null && sat == null && psat == null) return null;
  return { act, sat, psat };
}
