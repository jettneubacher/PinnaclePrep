import type { StudentAnalyticsContext, StatJobResult } from "./contextTypes";

export function deriveTutoringVsImprovementScatter(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const data = ctx.blocks
    .filter(
      (b) =>
        b.tutoringHours != null &&
        b.improvementTotal != null &&
        b.tutoringHours >= 0,
    )
    .map((b) => ({
      studentName: b.studentName,
      tutoringHours: b.tutoringHours!,
      improvement: b.improvementTotal!,
      testType: b.testType,
    }));
  return {
    summary: `${data.length} points (student–test) with tutoring hours and TOTAL improvement.`,
    data,
  };
}

export function deriveAvgTutoringHoursByTestType(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { sum: number; n: number };
  const by = new Map<string, Acc>();
  for (const b of ctx.blocks) {
    if (b.tutoringHours == null) continue;
    const acc = by.get(b.testType) ?? { sum: 0, n: 0 };
    acc.sum += b.tutoringHours;
    acc.n += 1;
    by.set(b.testType, acc);
  }
  const data = [...by.entries()].map(([testType, acc]) => ({
    testType,
    avgHours: acc.sum / acc.n,
    studentCount: acc.n,
  }));
  return {
    summary: `${data.length} test-type buckets with tutoring hour data.`,
    data,
  };
}

export function deriveAvgTutoringHoursByCompletion(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { sum: number; n: number };
  const by = new Map<string, Acc>();
  for (const b of ctx.blocks) {
    if (b.tutoringHours == null) continue;
    const key = b.completion.trim() || "(blank)";
    const acc = by.get(key) ?? { sum: 0, n: 0 };
    acc.sum += b.tutoringHours;
    acc.n += 1;
    by.set(key, acc);
  }
  const data = [...by.entries()].map(([completion, acc]) => ({
    completion,
    avgHours: acc.sum / acc.n,
    studentCount: acc.n,
  }));
  return {
    summary: `${data.length} completion buckets.`,
    data,
  };
}
