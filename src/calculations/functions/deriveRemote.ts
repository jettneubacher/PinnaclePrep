import type { ImprovementSection } from "./deriveScore";
import type {
  StudentAnalyticsContext,
  StatJobResult,
  TestType,
} from "./contextTypes";

function remoteBucket(pct: number): string {
  if (pct <= 0) return "0%";
  if (pct <= 25) return "1–25%";
  if (pct <= 50) return "26–50%";
  if (pct <= 75) return "51–75%";
  return "76–100%";
}

export function deriveRemoteVsImprovementSectionsScatter(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Row = {
    studentName: string;
    testType: TestType;
    remotePercent: number;
    section: ImprovementSection;
    delta: number;
  };
  const data: Row[] = [];
  for (const b of ctx.blocks) {
    if (b.remotePct == null) continue;
    const rp = b.remotePct;
    if (b.improvementTotal != null) {
      data.push({
        studentName: b.studentName,
        testType: b.testType,
        remotePercent: rp,
        section: "TOTAL",
        delta: b.improvementTotal,
      });
    }
    if (b.improvementVerbal != null) {
      data.push({
        studentName: b.studentName,
        testType: b.testType,
        remotePercent: rp,
        section: "VERBAL",
        delta: b.improvementVerbal,
      });
    }
    if (b.improvementMath != null) {
      data.push({
        studentName: b.studentName,
        testType: b.testType,
        remotePercent: rp,
        section: "MATH",
        delta: b.improvementMath,
      });
    }
  }
  return {
    summary: `${data.length} points: remote % vs Δ by TOTAL / VERBAL / MATH.`,
    data,
  };
}

export function deriveRemoteVsPrepLengthScatter(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const data = ctx.blocks
    .filter((b) => b.remotePct != null && b.prepLengthWeeks != null)
    .map((b) => ({
      studentName: b.studentName,
      remotePercent: b.remotePct!,
      prepLengthWeeks: b.prepLengthWeeks!,
      testType: b.testType,
    }));
  return {
    summary: `${data.length} points: remote % vs prep length (weeks).`,
    data,
  };
}

export function deriveAvgImprovementByRemoteBucket(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  type Acc = { sum: number; n: number };
  /** `${testType}\0${bucket}` */
  const by = new Map<string, Acc>();
  for (const b of ctx.blocks) {
    if (b.improvementTotal == null || b.remotePct == null) continue;
    const bucket = remoteBucket(b.remotePct);
    const key = `${b.testType}\0${bucket}`;
    const acc = by.get(key) ?? { sum: 0, n: 0 };
    acc.sum += b.improvementTotal;
    acc.n += 1;
    by.set(key, acc);
  }
  const order = ["0%", "1–25%", "26–50%", "51–75%", "76–100%"];
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
    summary: `${data.length} remote % buckets × test type with improvement data.`,
    data,
  };
}
