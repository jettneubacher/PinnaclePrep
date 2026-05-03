import { FIELDS } from "../fields";
import type { StudentAnalyticsContext, StatJobResult } from "./contextTypes";
import { TEST_TYPES } from "./contextTypes";
import { isCompleteCompletion, mean, parseIntCell } from "./utils";

export function deriveSummaryHeadlineByTestType(
  ctx: StudentAnalyticsContext,
): StatJobResult {
  const data = TEST_TYPES.map((testType) => {
    const blocks = ctx.blocks.filter((b) => b.testType === testType);
    const studentCount = blocks.length;
    const baselines = blocks
      .map((b) => b.baselineTotal)
      .filter((n): n is number => n != null);
    const latests = blocks
      .map((b) => parseIntCell(b.latestRow?.[FIELDS.TOTAL]))
      .filter((n): n is number => n != null);
    const imps = blocks
      .map((b) => b.improvementTotal)
      .filter((n): n is number => n != null);
    const hours = blocks
      .map((b) => b.tutoringHours)
      .filter((n): n is number => n != null);
    const preps = blocks
      .map((b) => b.prepLengthWeeks)
      .filter((n): n is number => n != null);
    let complete = 0;
    let incomplete = 0;
    for (const b of blocks) {
      if (isCompleteCompletion(b.completion)) complete += 1;
      else incomplete += 1;
    }
    const t = complete + incomplete;
    return {
      testType,
      studentCount,
      avgBaselineTotal: mean(baselines) ?? 0,
      avgLatestTotal: mean(latests) ?? 0,
      avgImprovement: mean(imps) ?? 0,
      avgTutoringHours: mean(hours) ?? 0,
      avgPrepWeeks: mean(preps) ?? 0,
      completionRate: t > 0 ? complete / t : 0,
    };
  });
  return {
    summary: `Headline row per test type (${data.map((d) => `${d.testType}: n=${d.studentCount}`).join("; ")}).`,
    data,
  };
}
