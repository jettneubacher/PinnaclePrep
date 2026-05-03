import type { StatChartRenderer } from "./charts/types";
import CompletionAvgImprovementByLabel from "./charts/byStat/completion_avg_improvement_by_label";
import CompletionRateByGradYear from "./charts/byStat/completion_rate_by_grad_year";
import CompletionRateByTestType from "./charts/byStat/completion_rate_by_test_type";
import CompletionRateOverall from "./charts/byStat/completion_rate_overall";
import DistributionBaselineTotalByTestType from "./charts/byStat/distribution_baseline_total_by_test_type";
import DistributionImprovementsByTestType from "./charts/byStat/distribution_improvements_by_test_type";
import DistributionLatestTotalByTestType from "./charts/byStat/distribution_latest_total_by_test_type";
import NumTestsAvgImprovementByBucket from "./charts/byStat/num_tests_avg_improvement_by_bucket";
import NumTestsVsImprovementScatter from "./charts/byStat/num_tests_vs_improvement_scatter";
import PrepAvgWeeksByGradYear from "./charts/byStat/prep_avg_weeks_by_grad_year";
import PrepAvgWeeksByTestType from "./charts/byStat/prep_avg_weeks_by_test_type";
import PrepLengthVsImprovementScatter from "./charts/byStat/prep_length_vs_improvement_scatter";
import PrepLengthVsTutoringHoursScatter from "./charts/byStat/prep_length_vs_tutoring_hours_scatter";
import RemoteAvgImprovementByBucket from "./charts/byStat/remote_avg_improvement_by_bucket";
import RemoteVsPrepLengthScatter from "./charts/byStat/remote_vs_prep_length_scatter";
import RemoteVsImprovementSectionsScatter from "./charts/byStat/remote_vs_improvement_sections_scatter";
import ScoreImprovementByGradYear from "./charts/byStat/score_improvement_by_grad_year";
import ScoreImprovementSectionsPerTrack from "./charts/byStat/score_improvement_sections_per_track";
import ScoreProgressionPerTrack from "./charts/byStat/score_progression_per_track";
import SummaryHeadlineByTestType from "./charts/byStat/summary_headline_by_test_type";
import TutoringAvgHoursByCompletion from "./charts/byStat/tutoring_avg_hours_by_completion";
import TutoringAvgHoursByTestType from "./charts/byStat/tutoring_avg_hours_by_test_type";
import TutoringHoursVsImprovementScatter from "./charts/byStat/tutoring_hours_vs_improvement_scatter";

/** Registered stat IDs map to lightweight chart wrappers under `charts/byStat`. */
export const STAT_CHART_REGISTRY: Partial<
  Record<string, StatChartRenderer>
> = {
  completion_avg_improvement_by_label: CompletionAvgImprovementByLabel,
  completion_rate_by_grad_year: CompletionRateByGradYear,
  completion_rate_by_test_type: CompletionRateByTestType,
  completion_rate_overall: CompletionRateOverall,
  distribution_baseline_total_by_test_type: DistributionBaselineTotalByTestType,
  distribution_improvements_by_test_type: DistributionImprovementsByTestType,
  distribution_latest_total_by_test_type: DistributionLatestTotalByTestType,
  num_tests_avg_improvement_by_bucket: NumTestsAvgImprovementByBucket,
  num_tests_vs_improvement_scatter: NumTestsVsImprovementScatter,
  prep_avg_weeks_by_grad_year: PrepAvgWeeksByGradYear,
  prep_avg_weeks_by_test_type: PrepAvgWeeksByTestType,
  prep_length_vs_improvement_scatter: PrepLengthVsImprovementScatter,
  prep_length_vs_tutoring_hours_scatter: PrepLengthVsTutoringHoursScatter,
  remote_avg_improvement_by_bucket: RemoteAvgImprovementByBucket,
  remote_vs_prep_length_scatter: RemoteVsPrepLengthScatter,
  remote_vs_improvement_sections_scatter: RemoteVsImprovementSectionsScatter,
  score_improvement_by_grad_year: ScoreImprovementByGradYear,
  score_improvement_sections_per_track: ScoreImprovementSectionsPerTrack,
  score_progression_per_track: ScoreProgressionPerTrack,
  summary_headline_by_test_type: SummaryHeadlineByTestType,
  tutoring_avg_hours_by_completion: TutoringAvgHoursByCompletion,
  tutoring_avg_hours_by_test_type: TutoringAvgHoursByTestType,
  tutoring_hours_vs_improvement_scatter: TutoringHoursVsImprovementScatter,
};
