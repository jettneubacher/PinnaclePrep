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
import {
  TEST_TYPES,
  type TestType,
} from "../../../../calculations/functions/contextTypes";
import {
  CHART_HEIGHT,
  FILL_BY_TEST_TYPE,
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
  xKey: string;
  yKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  /** When set, only this test type is plotted (single Y scale). */
  isolateTestType?: TestType;
};

function isScatterRow(o: unknown): o is Row {
  return !!o && typeof o === "object";
}

export function ScatterByTestTypeChart({
  data,
  xKey,
  yKey,
  xAxisLabel,
  yAxisLabel,
  isolateTestType,
}: Props) {
  const byType = useMemo(() => {
    if (!Array.isArray(data)) return null;
    const rows = data.filter(isScatterRow);
    const out: Partial<Record<TestType, Row[]>> = {};
    for (const t of TEST_TYPES) out[t] = [];
    for (const row of rows) {
      const tt = row.testType;
      const x = Number(row[xKey]);
      const y = Number(row[yKey]);
      if (typeof tt !== "string") continue;
      if (isolateTestType != null && tt !== isolateTestType) continue;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const bucket = out[tt as TestType];
      if (!bucket) continue;
      bucket.push({ ...row, [xKey]: x, [yKey]: y });
    }
    return out as Record<TestType, Row[]>;
  }, [data, isolateTestType, xKey, yKey]);

  if (!byType) {
    return <p className="stats-chart__empty">No chart data.</p>;
  }

  const modes = isolateTestType != null ? [isolateTestType] : TEST_TYPES;
  const anyPts = modes.some((t) => (byType[t]?.length ?? 0) > 0);
  if (!anyPts) {
    return <p className="stats-chart__empty">No points for this test type.</p>;
  }

  const multi = isolateTestType == null;

  return (
    <div className="stats-chart" role="img" aria-label={multi ? "Scatter chart by test type" : "Scatter chart"}>
      <StatsResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ScatterChart
          margin={
            multi
              ? { top: 38, right: 16, bottom: 40, left: 10 }
              : { top: 10, right: 16, bottom: 40, left: 10 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
          <XAxis
            type="number"
            dataKey={xKey}
            name={xAxisLabel ?? xKey}
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
            name={yAxisLabel ?? yKey}
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
          {multi ? (
            <Legend
              {...STATS_CHART_LEGEND_TOP}
              wrapperStyle={{ fontSize: 12, paddingBottom: 6 }}
            />
          ) : null}
          {(multi ? TEST_TYPES : [isolateTestType]).map((t) =>
            byType[t]!.length > 0 ? (
              <Scatter
                {...STATS_CHART_NO_SERIES_ANIMATION}
                key={t}
                name={t}
                data={byType[t]}
                fill={FILL_BY_TEST_TYPE[t]}
              />
            ) : null,
          )}
        </ScatterChart>
      </StatsResponsiveContainer>
    </div>
  );
}
