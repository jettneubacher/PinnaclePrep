import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

type SeriesRow = {
  testType: string;
  scores?: number[];
  improvements?: number[];
};

function isSeriesRow(o: unknown): o is SeriesRow {
  return !!o && typeof o === "object" && typeof (o as SeriesRow).testType === "string";
}

function buildBins(vals: number[], binCount: number): { bucket: string; count: number }[] {
  if (vals.length === 0) return [];
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) max = min + 1;
  const w = (max - min) / binCount;
  const counts = new Array(binCount).fill(0);
  for (const v of vals) {
    let idx = Math.floor((v - min) / w);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    counts[idx] += 1;
  }
  return counts.map((count, i) => {
    const lo = min + i * w;
    const hi = lo + w;
    return {
      bucket: `${lo.toFixed(0)}–${hi.toFixed(0)}`,
      count,
    };
  });
}

type Props = {
  data: unknown;
  valueArrayKey?: "scores" | "improvements";
  isolateTestType?: TestType;
};

const STRIP_HEIGHT = 200;

export function DistributionHistogramChart({
  data,
  valueArrayKey = "scores",
  isolateTestType,
}: Props) {
  const strips = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let rows = data.filter(isSeriesRow);
    if (isolateTestType != null) {
      rows = rows.filter((r) => r.testType === isolateTestType);
    }
    return rows.map((r) => {
      const vals =
        (valueArrayKey === "improvements" ? r.improvements ?? [] : r.scores ?? []).filter((x) =>
          Number.isFinite(x),
        ) as number[];
      const bins = Math.min(
        14,
        Math.max(6, Math.ceil(Math.sqrt(Math.max(vals.length, 4)))),
      );
      return {
        testType: r.testType,
        vals,
        bins: buildBins(vals, bins),
      };
    }).filter((s) => s.vals.length > 0);
  }, [data, isolateTestType, valueArrayKey]);

  if (!Array.isArray(data) || strips.length === 0) {
    return <p className="stats-chart__empty">No distribution data for this test type.</p>;
  }

  return (
    <div className="stats-chart stats-chart--stack" role="img" aria-label="Histogram by test">
      {strips.map((s) => (
        <div key={s.testType} className="stats-chart__strip">
          <p className="stats-chart__strip-title">{s.testType}</p>
          <StatsResponsiveContainer width="100%" height={STRIP_HEIGHT}>
            <BarChart margin={{ top: 4, right: 12, bottom: 20, left: 8 }} data={s.bins}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 9 }}
                stroke="var(--text-muted)"
                interval={0}
                angle={-35}
                textAnchor="end"
                height={48}
              />
              <YAxis allowDecimals />
              <Tooltip
                {...STATS_CHART_NO_TOOLTIP_ANIMATION}
                contentStyle={STATS_CHART_TOOLTIP_CONTENT}
                formatter={(v) => formatTooltipNumber(v)}
              />
              <Bar
                {...STATS_CHART_NO_SERIES_ANIMATION}
                dataKey="count"
                fill="#8884d8"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </StatsResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
