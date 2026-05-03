import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import {
  STATS_CHART_NO_SERIES_ANIMATION,
  STATS_CHART_NO_TOOLTIP_ANIMATION,
} from "./constants";
import { STATS_CHART_TOOLTIP_CONTENT, formatTooltipNumber } from "./tooltipStyles";
import { StatsResponsiveContainer } from "./StatsResponsiveContainer";

type Props = {
  data: unknown;
};

const COLORS = ["#82ca9d", "#bdbdbd"];

export function CompletionOverallPie({ data }: Props) {
  const slices = useMemo(() => {
    if (!data || typeof data !== "object") return [];
    const o = data as Record<string, number>;
    const c = Number(o.complete);
    const i = Number(o.incomplete);
    if (!Number.isFinite(c) || !Number.isFinite(i)) return [];
    return [
      { name: "Complete", value: c },
      { name: "Incomplete", value: i },
    ].filter((s) => s.value > 0);
  }, [data]);

  if (slices.length === 0) {
    return <p className="stats-chart__empty">No completion data.</p>;
  }

  return (
    <div className="stats-chart" role="img" aria-label="Completion pie chart">
      <StatsResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <Pie
            {...STATS_CHART_NO_SERIES_ANIMATION}
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={92}
            paddingAngle={1}
          >
            {slices.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            {...STATS_CHART_NO_TOOLTIP_ANIMATION}
            contentStyle={STATS_CHART_TOOLTIP_CONTENT}
            formatter={(value) => formatTooltipNumber(value)}
          />
          <Legend />
        </PieChart>
      </StatsResponsiveContainer>
    </div>
  );
}
