import type { TestType } from "../../../../calculations/functions/contextTypes";
import type { ImprovementSection } from "../../../../calculations/functions/deriveScore";

export const CHART_HEIGHT = 280;

/**
 * Recharts runs JS-driven tweens per series by default — expensive with many charts on one page.
 * Spread onto Bar / Line / Pie / Scatter etc.
 */
export const STATS_CHART_NO_SERIES_ANIMATION = {
  isAnimationActive: false as const,
  animationDuration: 0,
  animationBegin: 0,
};

/** Tooltip bounding-box animation adds layout work while moving. */
export const STATS_CHART_NO_TOOLTIP_ANIMATION = {
  isAnimationActive: false as const,
  animationDuration: 0,
};

/** Keeps categorical legend above plot so axis titles fit below ticks. */
export const STATS_CHART_LEGEND_TOP = {
  verticalAlign: "top" as const,
  align: "center" as const,
};

export const STATS_AXIS_LABEL_OUTSIDE_BOTTOM = {
  position: "bottom" as const,
  offset: 14,
  fill: "var(--text-muted)",
  fontSize: 11,
};

export const FILL_BY_TEST_TYPE: Record<TestType, string> = {
  ACT: "#82ca9d",
  SAT: "#8884d8",
  PSAT: "#ffc658",
};

export const FILL_BY_IMPROVEMENT_SECTION: Record<
  ImprovementSection,
  string
> = {
  TOTAL: "#8884d8",
  VERBAL: "#82ca9d",
  MATH: "#ffc658",
};
