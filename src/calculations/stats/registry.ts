import type { StatConfig } from "./types";
import {
  STATS_REQUIRED_FIELDS,
  STATS_REQUIRED_NON_EMPTY,
} from "./types";
import * as score from "../functions/deriveScore";
import * as tutoring from "../functions/deriveTutoring";
import * as remote from "../functions/deriveRemote";
import * as prep from "../functions/derivePrep";
import * as numTests from "../functions/deriveNumTests";
import * as completion from "../functions/deriveCompletion";
import * as distribution from "../functions/deriveDistribution";
import * as summary from "../functions/deriveSummary";

const base = {
  requiredFields: STATS_REQUIRED_FIELDS,
  requiredNonEmptyFields: STATS_REQUIRED_NON_EMPTY,
} as const;

function job(
  id: string,
  label: string,
  calculate: StatConfig["calculate"],
): StatConfig {
  return { id, label, ...base, calculate };
}

export const STATS: StatConfig[] = [
  job(
    "score_improvement_sections_per_track",
    "Score baseline vs Δ by section (TOTAL / VERBAL / MATH)",
    score.deriveScoreImprovementSectionsPerTrack,
  ),
  job(
    "score_progression_per_track",
    "Score TOTAL progression over time (trajectory points)",
    score.deriveScoreProgression,
  ),
  job(
    "score_improvement_by_grad_year",
    "Score average TOTAL improvement by grad year",
    score.deriveImprovementByGradYear,
  ),
  job(
    "tutoring_hours_vs_improvement_scatter",
    "Tutoring hours vs TOTAL improvement (scatter)",
    tutoring.deriveTutoringVsImprovementScatter,
  ),
  job(
    "tutoring_avg_hours_by_test_type",
    "Tutoring average hours by test type",
    tutoring.deriveAvgTutoringHoursByTestType,
  ),
  job(
    "tutoring_avg_hours_by_completion",
    "Tutoring average hours by completion label",
    tutoring.deriveAvgTutoringHoursByCompletion,
  ),
  job(
    "remote_vs_improvement_sections_scatter",
    "Remote % vs TOTAL / VERBAL / MATH improvement",
    remote.deriveRemoteVsImprovementSectionsScatter,
  ),
  job(
    "remote_vs_prep_length_scatter",
    "Remote % vs prep length (weeks)",
    remote.deriveRemoteVsPrepLengthScatter,
  ),
  job(
    "remote_avg_improvement_by_bucket",
    "Remote % average TOTAL improvement by remote bucket",
    remote.deriveAvgImprovementByRemoteBucket,
  ),
  job(
    "prep_length_vs_improvement_scatter",
    "Prep length (weeks) vs TOTAL improvement",
    prep.derivePrepLengthVsImprovementScatter,
  ),
  job(
    "prep_avg_weeks_by_test_type",
    "Prep average weeks by test type",
    prep.deriveAvgPrepWeeksByTestType,
  ),
  job(
    "prep_avg_weeks_by_grad_year",
    "Prep average weeks by grad year",
    prep.deriveAvgPrepWeeksByGradYear,
  ),
  job(
    "prep_length_vs_tutoring_hours_scatter",
    "Prep length vs tutoring hours",
    prep.derivePrepLengthVsTutoringHoursScatter,
  ),
  job(
    "num_tests_vs_improvement_scatter",
    "Num tests vs TOTAL improvement",
    numTests.deriveNumTestsVsImprovementScatter,
  ),
  job(
    "num_tests_avg_improvement_by_bucket",
    "Num tests average TOTAL improvement by bucket (1–5+)",
    numTests.deriveAvgImprovementByNumTestsBucket,
  ),
  job(
    "completion_rate_overall",
    "Completion rate overall (per student)",
    completion.deriveCompletionRateOverall,
  ),
  job(
    "completion_rate_by_grad_year",
    "Completion rate by grad year",
    completion.deriveCompletionRateByGradYear,
  ),
  job(
    "completion_rate_by_test_type",
    "Completion rate by test type (per student–test track)",
    completion.deriveCompletionRateByTestType,
  ),
  job(
    "completion_avg_improvement_by_label",
    "Completion average TOTAL improvement by completion label",
    completion.deriveAvgImprovementByCompletion,
  ),
  job(
    "distribution_baseline_total_by_test_type",
    "Distribution baseline TOTAL scores by test type",
    distribution.deriveDistributionBaselineScoresByTestType,
  ),
  job(
    "distribution_latest_total_by_test_type",
    "Distribution latest TOTAL scores by test type",
    distribution.deriveDistributionFinalScoresByTestType,
  ),
  job(
    "distribution_improvements_by_test_type",
    "Distribution TOTAL improvement values by test type",
    distribution.deriveDistributionImprovements,
  ),
  job(
    "summary_headline_by_test_type",
    "Summary headline metrics per test type",
    summary.deriveSummaryHeadlineByTestType,
  ),
];
