import type { StudentAnalyticsContext, StatJobResult } from "./contextTypes";

export function derivePrepLengthVsImprovementScatter(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const data = ctx.blocks
    .filter(
      (b) => b.prepLengthWeeks != null && b.improvementTotal != null,
    )
    .map((b) => ({
      studentName: b.studentName,
      prepLengthWeeks: b.prepLengthWeeks!,
      improvement: b.improvementTotal!,
      testType: b.testType,
    }));
  return {
    summary: `${data.length} points: prep length (weeks) vs TOTAL improvement.`,
    data,
  };
}

export function deriveAvgPrepWeeksByTestType(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { sum: number; n: number };
  const by = new Map<string, Acc>();
  for (const b of ctx.blocks) {
    if (b.prepLengthWeeks == null) continue;
    const acc = by.get(b.testType) ?? { sum: 0, n: 0 };
    acc.sum += b.prepLengthWeeks;
    acc.n += 1;
    by.set(b.testType, acc);
  }
  const data = [...by.entries()].map(([testType, acc]) => ({
    testType,
    avgPrepWeeks: acc.sum / acc.n,
    studentCount: acc.n,
  }));
  return {
    summary: `${data.length} test types with prep length.`,
    data,
  };
}

export function deriveAvgPrepWeeksByGradYear(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { sum: number; n: number };
  const by = new Map<number, Acc>();
  for (const b of ctx.blocks) {
    if (b.prepLengthWeeks == null || b.gradYear == null) continue;
    const acc = by.get(b.gradYear) ?? { sum: 0, n: 0 };
    acc.sum += b.prepLengthWeeks;
    acc.n += 1;
    by.set(b.gradYear, acc);
  }
  const data = [...by.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gradYear, acc]) => ({
      gradYear,
      avgPrepWeeks: acc.sum / acc.n,
      studentCount: acc.n,
    }));
  return {
    summary: `${data.length} grad years with prep length.`,
    data,
  };
}

export function derivePrepLengthVsTutoringHoursScatter(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const data = ctx.blocks
    .filter(
      (b) => b.prepLengthWeeks != null && b.tutoringHours != null,
    )
    .map((b) => ({
      studentName: b.studentName,
      prepLengthWeeks: b.prepLengthWeeks!,
      tutoringHours: b.tutoringHours!,
      testType: b.testType,
    }));
  return {
    summary: `${data.length} points: prep weeks vs tutoring hours.`,
    data,
  };
}
