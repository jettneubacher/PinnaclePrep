import { useMemo } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import type { TestType } from "../../../../calculations/functions/contextTypes";
import {
  STATS_CHART_TOOLTIP_CONTENT,
  formatTooltipNumber,
} from "./tooltipStyles";
import {
  STATS_CHART_NO_SERIES_ANIMATION,
  STATS_CHART_NO_TOOLTIP_ANIMATION,
} from "./constants";
import { StatsResponsiveContainer } from "./StatsResponsiveContainer";

type Row = {
  testType: string;
  complete: number;
  incomplete: number;
};

function isRow(o: unknown): o is Row {
  return !!o && typeof o === "object" && typeof (o as Row).testType === "string";
}

const GREEN = "#82ca9d";
const GRAY = "#bdbdbd";

export function CompletionByTestTypePieRow({
  data,
  isolateTestType,
}: {
  data: unknown;
  isolateTestType?: TestType;
}) {
  const series = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let rows = data.filter(isRow);
    if (isolateTestType != null) {
      rows = rows.filter((r) => r.testType === isolateTestType);
    }
    return rows;
  }, [data, isolateTestType]);

  if (series.length === 0) {
    return <p className="stats-chart__empty">No completion data for this test type.</p>;
  }

  return (
    <div className="stats-chart stats-chart__pie-grid" role="img" aria-label="Completion rate">
      {series.map((r) => {
        const pies = [
          { name: "Complete", value: r.complete },
          { name: "Incomplete", value: r.incomplete },
        ].filter((p) => p.value > 0);
        return (
          <div key={r.testType} className="stats-chart__pie-cell">
            <p className="stats-chart__strip-title">{r.testType}</p>
            <StatsResponsiveContainer width="100%" height={200}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  {...STATS_CHART_NO_SERIES_ANIMATION}
                  data={pies}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={74}
                  paddingAngle={1}
                >
                  {pies.map((pie) => (
                    <Cell
                      key={pie.name}
                      fill={pie.name === "Complete" ? GREEN : GRAY}
                    />
                  ))}
                </Pie>
                <Tooltip
                  {...STATS_CHART_NO_TOOLTIP_ANIMATION}
                  contentStyle={STATS_CHART_TOOLTIP_CONTENT}
                  formatter={(value) => formatTooltipNumber(value)}
                />
              </PieChart>
            </StatsResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
