import type {
  StudentAnalyticsContext,
  StatJobResult,
  TestType,
} from "./contextTypes";
import { mean } from "./utils";

export const IMPROVEMENT_SECTIONS = ["TOTAL", "VERBAL", "MATH"] as const;
export type ImprovementSection = (typeof IMPROVEMENT_SECTIONS)[number];

export function deriveScoreImprovementSectionsPerTrack(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Row = {
    studentName: string;
    testType: TestType;
    section: ImprovementSection;
    baseline: number;
    delta: number;
  };
  const data: Row[] = [];
  for (const b of ctx.blocks) {
    if (
      b.improvementTotal != null &&
      b.baselineTotal != null &&
      b.latestTotal != null
    ) {
      data.push({
        studentName: b.studentName,
        testType: b.testType,
        section: "TOTAL",
        baseline: b.baselineTotal,
        delta: b.improvementTotal,
      });
    }
    if (
      b.improvementVerbal != null &&
      b.baselineVerbal != null &&
      b.latestVerbal != null
    ) {
      data.push({
        studentName: b.studentName,
        testType: b.testType,
        section: "VERBAL",
        baseline: b.baselineVerbal,
        delta: b.improvementVerbal,
      });
    }
    if (
      b.improvementMath != null &&
      b.baselineMath != null &&
      b.latestMath != null
    ) {
      data.push({
        studentName: b.studentName,
        testType: b.testType,
        section: "MATH",
        baseline: b.baselineMath,
        delta: b.improvementMath,
      });
    }
  }
  const m = mean(data.map((d) => d.delta));
  return {
    summary: `${data.length} points (TOTAL / VERBAL / MATH sections); overall mean Δ ${m == null ? "n/a" : m.toFixed(2)}.`,
    data,
  };
}

export function deriveScoreProgression(ctx: StudentAnalyticsContext): StatJobResult {
  const data = ctx.blocks
    .filter((b) => b.progression.length > 0)
    .map((b) => ({
      studentName: b.studentName,
      testType: b.testType,
      points: b.progression,
    }));
  return {
    summary: `${data.length} student–test tracks with ≥1 scored TOTAL point for trajectory.`,
    data,
  };
}

export function deriveImprovementByGradYear(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { sum: number; n: number };
  /** key: `${gradYear}|${testType}` */
  const by = new Map<string, Acc>();
  for (const b of ctx.blocks) {
    if (b.improvementTotal == null || b.gradYear == null) continue;
    const key = `${b.gradYear}\0${b.testType}`;
    const acc = by.get(key) ?? { sum: 0, n: 0 };
    acc.sum += b.improvementTotal;
    acc.n += 1;
    by.set(key, acc);
  }
  const data = [...by.entries()].map(([compound, acc]) => {
    const sep = compound.indexOf("\0");
    const gy = compound.slice(0, sep);
    const tt = compound.slice(sep + 1);
    return {
      gradYear: Number(gy),
      testType: tt,
      avgImprovement: acc.sum / acc.n,
      studentCount: acc.n,
    };
  });
  data.sort((a, b) =>
    a.gradYear !== b.gradYear
      ? a.gradYear - b.gradYear
      : a.testType.localeCompare(b.testType),
  );
  return {
    summary: `${data.length} grad-year × test-type buckets with ≥1 TOTAL improvement track.`,
    data,
  };
}
