import { FIELDS } from "../fields";
import { TEST_TYPES, type StudentAnalyticsContext, type StatJobResult } from "./contextTypes";
import { parseIntCell } from "./utils";

export function deriveDistributionBaselineScoresByTestType(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const by = new Map<string, number[]>();
  for (const t of TEST_TYPES) by.set(t, []);
  for (const b of ctx.blocks) {
    if (b.baselineTotal == null) continue;
    by.get(b.testType)!.push(b.baselineTotal);
  }
  const data = [...by.entries()].map(([testType, scores]) => ({
    testType,
    scores,
  }));
  return {
    summary: `Baseline TOTAL counts: ${data.map((d) => `${d.testType}=${d.scores.length}`).join(", ")}.`,
    data,
  };
}

export function deriveDistributionFinalScoresByTestType(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const by = new Map<string, number[]>();
  for (const t of TEST_TYPES) by.set(t, []);
  for (const b of ctx.blocks) {
    const lt = parseIntCell(b.latestRow?.[FIELDS.TOTAL]);
    if (lt == null) continue;
    by.get(b.testType)!.push(lt);
  }
  const data = [...by.entries()].map(([testType, scores]) => ({
    testType,
    scores,
  }));
  return {
    summary: `Latest TOTAL counts: ${data.map((d) => `${d.testType}=${d.scores.length}`).join(", ")}.`,
    data,
  };
}

export function deriveDistributionImprovements(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const by = new Map<string, number[]>();
  for (const t of TEST_TYPES) by.set(t, []);
  for (const b of ctx.blocks) {
    if (b.improvementTotal == null) continue;
    by.get(b.testType)!.push(b.improvementTotal);
  }
  const series = [...by.entries()].map(([testType, improvements]) => ({
    testType,
    improvements,
  }));
  return {
    summary: `Improvement histogram inputs: ${series.map((s) => `${s.testType}=${s.improvements.length}`).join(", ")}.`,
    data: series,
  };
}
