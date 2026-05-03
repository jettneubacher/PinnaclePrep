import type { StudentAnalyticsContext, StatJobResult } from "./contextTypes";

function numTestsBucket(n: number): string {
  if (n <= 0) return "0";
  if (n <= 4) return String(n);
  return "5+";
}

export function deriveNumTestsVsImprovementScatter(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const data = ctx.blocks
    .filter((b) => b.numTests != null && b.improvementTotal != null && b.numTests > 0)
    .map((b) => ({
      studentName: b.studentName,
      numTests: b.numTests!,
      improvement: b.improvementTotal!,
      testType: b.testType,
    }));
  return {
    summary: `${data.length} points: NUM TESTS vs TOTAL improvement.`,
    data,
  };
}

export function deriveAvgImprovementByNumTestsBucket(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { sum: number; n: number };
  /** `${testType}|${bucket}` — use delimiter that doesn't appear in bucket */
  const by = new Map<string, Acc>();
  for (const b of ctx.blocks) {
    if (b.improvementTotal == null || b.numTests == null || b.numTests <= 0)
      continue;
    const bucket = numTestsBucket(b.numTests);
    const key = `${b.testType}\0${bucket}`;
    const acc = by.get(key) ?? { sum: 0, n: 0 };
    acc.sum += b.improvementTotal;
    acc.n += 1;
    by.set(key, acc);
  }
  const order = ["1", "2", "3", "4", "5+"];
  const data: {
    testType: string;
    bucket: string;
    avgImprovement: number;
    studentCount: number;
  }[] = [];
  for (const tt of ["ACT", "SAT", "PSAT"] as const) {
    for (const bucket of order) {
      const key = `${tt}\0${bucket}`;
      const acc = by.get(key);
      if (!acc) continue;
      data.push({
        testType: tt,
        bucket,
        avgImprovement: acc.sum / acc.n,
        studentCount: acc.n,
      });
    }
  }
  return {
    summary: `${data.length} NUM TESTS buckets × test type.`,
    data,
  };
}
