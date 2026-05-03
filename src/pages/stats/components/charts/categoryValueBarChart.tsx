import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  STATS_CHART_TOOLTIP_CONTENT,
  formatTooltipNumber,
} from "./tooltipStyles";
import {
  CHART_HEIGHT,
  STATS_CHART_NO_SERIES_ANIMATION,
  STATS_CHART_NO_TOOLTIP_ANIMATION,
} from "./constants";
import { StatsResponsiveContainer } from "./StatsResponsiveContainer";

type Row = Record<string, string | number | undefined>;

type Props = {
  data: Row[];
  categoryKey: string;
  valueKey: string;
  ariaLabel?: string;
  tickFormatterCategory?: (v: string) => string;
};

export function CategoryValueBarChart({
  data,
  categoryKey,
  valueKey,
  ariaLabel,
  tickFormatterCategory,
}: Props) {
  const memo = useMemo(() => [...data], [data]);

  if (memo.length === 0) {
    return <p className="stats-chart__empty">No bar chart data.</p>;
  }

  return (
    <div className="stats-chart" role="img" aria-label={ariaLabel ?? "Bar chart"}>
      <StatsResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart margin={{ top: 8, right: 12, bottom: 24, left: 8 }} data={memo}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
          <XAxis
            dataKey={categoryKey}
            interval={0}
            angle={memo.some((r) => String(r[categoryKey]).length > 8) ? -30 : 0}
            height={memo.some((r) => String(r[categoryKey]).length > 8) ? 56 : undefined}
            textAnchor="end"
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            stroke="var(--text-muted)"
            tickFormatter={tickFormatterCategory}
          />
          <YAxis
            dataKey={valueKey}
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            stroke="var(--text-muted)"
          />
          <Tooltip
            {...STATS_CHART_NO_TOOLTIP_ANIMATION}
            contentStyle={STATS_CHART_TOOLTIP_CONTENT}
            formatter={(value) => formatTooltipNumber(value)}
          />
          <Bar
            {...STATS_CHART_NO_SERIES_ANIMATION}
            dataKey={valueKey}
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </StatsResponsiveContainer>
    </div>
  );
}
