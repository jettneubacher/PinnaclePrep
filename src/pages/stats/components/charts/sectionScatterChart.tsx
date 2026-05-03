import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TestType } from "../../../../calculations/functions/contextTypes";
import {
  IMPROVEMENT_SECTIONS,
  type ImprovementSection,
} from "../../../../calculations/functions/deriveScore";
import {
  CHART_HEIGHT,
  FILL_BY_IMPROVEMENT_SECTION,
  STATS_AXIS_LABEL_OUTSIDE_BOTTOM,
  STATS_CHART_LEGEND_TOP,
  STATS_CHART_NO_SERIES_ANIMATION,
  STATS_CHART_NO_TOOLTIP_ANIMATION,
} from "./constants";
import { formatTooltipNumber, statsChartTooltipOuter } from "./tooltipStyles";
import { StatsResponsiveContainer } from "./StatsResponsiveContainer";

type Row = Record<string, string | number | undefined>;

type Props = {
  data: unknown;
  isolateTestType?: TestType;
  xKey: string;
  yKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
};

function isRow(o: unknown): o is Row {
  return !!o && typeof o === "object";
}

export function SectionImprovementScatterChart({
  data,
  isolateTestType,
  xKey,
  yKey,
  xAxisLabel,
  yAxisLabel,
}: Props) {
  const bySection = useMemo(() => {
    if (!Array.isArray(data)) return null;
    const out: Partial<Record<ImprovementSection, Row[]>> = {};
    for (const s of IMPROVEMENT_SECTIONS) out[s] = [];
    const rows = data.filter(isRow);
    for (const row of rows) {
      const sec = row.section;
      const tt = row.testType;
      if (typeof sec !== "string") continue;
      if (!IMPROVEMENT_SECTIONS.includes(sec as ImprovementSection)) continue;
      if (isolateTestType != null && tt !== isolateTestType) continue;
      const x = Number(row[xKey]);
      const y = Number(row[yKey]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const bucket = out[sec as ImprovementSection];
      if (!bucket) continue;
      bucket.push({ ...row, [xKey]: x, [yKey]: y });
    }
    return out as Record<ImprovementSection, Row[]>;
  }, [data, isolateTestType, xKey, yKey]);

  if (!bySection) {
    return <p className="stats-chart__empty">No chart data.</p>;
  }

  const anyPts = IMPROVEMENT_SECTIONS.some(
    (s) => (bySection[s]?.length ?? 0) > 0,
  );
  if (!anyPts) {
    return <p className="stats-chart__empty">No points for this test type.</p>;
  }

  return (
    <div className="stats-chart" role="img" aria-label="Scatter by section">
      <StatsResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ScatterChart margin={{ top: 38, right: 16, bottom: 40, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
          <XAxis
            type="number"
            dataKey={xKey}
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            stroke="var(--text-muted)"
            label={{
              value: xAxisLabel ?? xKey,
              ...STATS_AXIS_LABEL_OUTSIDE_BOTTOM,
            }}
          />
          <YAxis
            type="number"
            dataKey={yKey}
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            stroke="var(--text-muted)"
            label={{
              value: yAxisLabel ?? yKey,
              angle: -90,
              position: "insideLeft",
              fill: "var(--text-muted)",
              fontSize: 11,
            }}
          />
          <Tooltip
            {...statsChartTooltipOuter}
            {...STATS_CHART_NO_TOOLTIP_ANIMATION}
            formatter={(value) => formatTooltipNumber(value)}
          />
          <Legend
            {...STATS_CHART_LEGEND_TOP}
            wrapperStyle={{ fontSize: 12, paddingBottom: 6 }}
          />
          {IMPROVEMENT_SECTIONS.map((s) =>
            bySection[s]!.length > 0 ? (
              <Scatter
                {...STATS_CHART_NO_SERIES_ANIMATION}
                key={s}
                name={s}
                data={bySection[s]}
                fill={FILL_BY_IMPROVEMENT_SECTION[s]}
              />
            ) : null,
          )}
        </ScatterChart>
      </StatsResponsiveContainer>
    </div>
  );
}
