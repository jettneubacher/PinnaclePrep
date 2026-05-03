import { useMemo } from "react";
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_HEIGHT,
  STATS_AXIS_LABEL_OUTSIDE_BOTTOM,
  STATS_CHART_NO_SERIES_ANIMATION,
  STATS_CHART_NO_TOOLTIP_ANIMATION,
} from "./constants";
import type { TestType } from "../../../../calculations/functions/contextTypes";
import { formatTooltipNumber, statsChartTooltipOuter } from "./tooltipStyles";
import { StatsResponsiveContainer } from "./StatsResponsiveContainer";

type Row = Record<string, string | number | undefined>;

type Props = {
  data: unknown;
  xKey: string;
  yKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  fill?: string;
  isolateTestType?: TestType;
};

function isRow(o: unknown): o is Row {
  return !!o && typeof o === "object";
}

export function SimpleScatterChart({
  data,
  xKey,
  yKey,
  xAxisLabel,
  yAxisLabel,
  fill = "#8884d8",
  isolateTestType,
}: Props) {
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const out: Row[] = [];
    for (const raw of data) {
      if (!isRow(raw)) continue;
      const tt =
        typeof raw.testType === "string" ? raw.testType : undefined;
      if (isolateTestType != null) {
        if (tt !== isolateTestType) continue;
      }
      const x = Number(raw[xKey]);
      const y = Number(raw[yKey]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      out.push({ ...raw, [xKey]: x, [yKey]: y });
    }
    return out;
  }, [data, isolateTestType, xKey, yKey]);

  if (rows.length === 0) {
    return <p className="stats-chart__empty">No points match this chart.</p>;
  }

  return (
    <div className="stats-chart" role="img" aria-label="Scatter chart">
      <StatsResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 40, left: 10 }}>
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
          <Scatter {...STATS_CHART_NO_SERIES_ANIMATION} data={rows} fill={fill} name="tracks" />
        </ScatterChart>
      </StatsResponsiveContainer>
    </div>
  );
}
