import type { StudentAnalyticsContext, StatJobResult } from "./contextTypes";
import { isCompleteCompletion, mean } from "./utils";

export function deriveCompletionRateOverall(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  let complete = 0;
  let incomplete = 0;
  for (const r of ctx.rollups) {
    if (isCompleteCompletion(r.completion)) complete += 1;
    else incomplete += 1;
  }
  const total = complete + incomplete;
  const completionRate = total > 0 ? complete / total : 0;
  const data = { complete, incomplete, completionRate };
  return {
    summary: `Students: ${complete} complete, ${incomplete} not (${(completionRate * 100).toFixed(1)}% completion).`,
    data,
  };
}

export function deriveCompletionRateByGradYear(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { complete: number; incomplete: number };
  const by = new Map<number, Acc>();
  for (const r of ctx.rollups) {
    if (r.gradYear == null) continue;
    const acc = by.get(r.gradYear) ?? { complete: 0, incomplete: 0 };
    if (isCompleteCompletion(r.completion)) acc.complete += 1;
    else acc.incomplete += 1;
    by.set(r.gradYear, acc);
  }
  const data = [...by.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gradYear, acc]) => {
      const t = acc.complete + acc.incomplete;
      return {
        gradYear,
        complete: acc.complete,
        incomplete: acc.incomplete,
        completionRate: t > 0 ? acc.complete / t : 0,
      };
    });
  return {
    summary: `${data.length} grad years with student-level completion.`,
    data,
  };
}

export function deriveCompletionRateByTestType(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { complete: number; incomplete: number };
  const by = new Map<string, Acc>();
  for (const b of ctx.blocks) {
    const acc = by.get(b.testType) ?? { complete: 0, incomplete: 0 };
    if (isCompleteCompletion(b.completion)) acc.complete += 1;
    else acc.incomplete += 1;
    by.set(b.testType, acc);
  }
  const data = [...by.entries()].map(([testType, acc]) => {
    const t = acc.complete + acc.incomplete;
    return {
      testType,
      complete: acc.complete,
      incomplete: acc.incomplete,
      completionRate: t > 0 ? acc.complete / t : 0,
    };
  });
  return {
    summary: `${data.length} test types (tracks = student–test).`,
    data,
  };
}

export function deriveAvgImprovementByCompletion(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { sum: number; n: number };
  /** `${testType}|${completionLabel}` */
  const by = new Map<string, Acc>();
  for (const b of ctx.blocks) {
    if (b.improvementTotal == null) continue;
    const key = `${b.testType}\0${b.completion.trim() || "(blank)"}`;
    const acc = by.get(key) ?? { sum: 0, n: 0 };
    acc.sum += b.improvementTotal;
    acc.n += 1;
    by.set(key, acc);
  }
  const data = [...by.entries()].map(([compound, acc]) => {
    const sep = compound.indexOf("\0");
    const testType = compound.slice(0, sep);
    const completion = compound.slice(sep + 1);
    return {
      testType,
      completion,
      avgImprovement: acc.sum / acc.n,
      studentCount: acc.n,
    };
  });
  data.sort((a, b) =>
    a.testType.localeCompare(b.testType) ||
    a.completion.localeCompare(b.completion),
  );
  const m = mean(data.map((d) => d.avgImprovement));
  return {
    summary: `${data.length} completion × test-type buckets; grand mean ${m == null ? "n/a" : m.toFixed(2)}.`,
    data,
  };
}
