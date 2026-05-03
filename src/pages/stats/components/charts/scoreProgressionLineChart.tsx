import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FILL_BY_TEST_TYPE,
  STATS_CHART_LEGEND_TOP,
  STATS_CHART_NO_SERIES_ANIMATION,
  STATS_CHART_NO_TOOLTIP_ANIMATION,
} from "./constants";
import type { TestType } from "../../../../calculations/functions/contextTypes";
import { formatTooltipNumber, statsChartTooltipOuter } from "./tooltipStyles";
import { StatsResponsiveContainer } from "./StatsResponsiveContainer";

type Pt = { testDate: string; total: number };
type Track = { studentName: string; testType: string; points: Pt[] };

function isTrack(o: unknown): o is Track {
  if (!o || typeof o !== "object") return false;
  const t = o as Track;
  return (
    typeof t.studentName === "string" &&
    typeof t.testType === "string" &&
    Array.isArray(t.points)
  );
}

function lineStroke(testType: string): string {
  return FILL_BY_TEST_TYPE[testType as TestType] ?? "#8884d8";
}

export function ScoreProgressionLineChart({
  data,
  isolateTestType,
}: {
  data: unknown;
  isolateTestType?: TestType;
}) {
  const { rows, keys } = useMemo(() => {
    if (!Array.isArray(data)) {
      return {
        rows: [] as Record<string, string | number | null>[],
        keys: [] as string[],
      };
    }
    let tracks = data.filter(isTrack);
    if (isolateTestType != null) {
      tracks = tracks.filter((t) => t.testType === isolateTestType);
    }

    const dateSet = new Set<string>();
    for (const t of tracks) {
      for (const p of t.points) dateSet.add(p.testDate);
    }
    const dates = [...dateSet].sort();

    const keyList: string[] = [];
    const rowsBuilt: Record<string, string | number | null>[] = dates.map((d) => ({
      testDate: d,
    }));

    tracks.forEach((t) => {
      const key = `${t.studentName} (${t.testType})`;
      keyList.push(key);
      for (let i = 0; i < dates.length; i++) {
        const d = dates[i]!;
        const pt = t.points.find((x) => x.testDate === d);
        rowsBuilt[i][key] =
          pt && Number.isFinite(pt.total) ? pt.total : null;
      }
    });

    return { rows: rowsBuilt, keys: keyList };
  }, [data, isolateTestType]);

  if (keys.length === 0 || rows.length === 0) {
    return <p className="stats-chart__empty">No progression lines for this test type.</p>;
  }

  return (
    <div className="stats-chart" role="img" aria-label="Score progression lines">
      <StatsResponsiveContainer width="100%" height={320}>
        <LineChart margin={{ top: 36, right: 16, bottom: 16, left: 8 }} data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
          <XAxis dataKey="testDate" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
          <YAxis tick={{ fontSize: 11 }} allowDecimals domain={["auto", "auto"]} />
          <Tooltip
            {...statsChartTooltipOuter}
            {...STATS_CHART_NO_TOOLTIP_ANIMATION}
            formatter={(v: unknown) =>
              typeof v === "number" ? formatTooltipNumber(v) : "—"
            }
          />
          <Legend
            {...STATS_CHART_LEGEND_TOP}
            wrapperStyle={{ fontSize: 10, paddingBottom: 8 }}
          />
          {keys.map((k) => {
            const [, ttMaybe] = k.match(/\(([A-Za-z]+)\)$/) ?? [];
            return (
              <Line
                {...STATS_CHART_NO_SERIES_ANIMATION}
                animateNewValues={false}
                key={k}
                type="monotone"
                connectNulls
                dataKey={k}
                name={k}
                stroke={lineStroke(ttMaybe ?? "SAT")}
                dot={{ r: 2 }}
              />
            );
          })}
        </LineChart>
      </StatsResponsiveContainer>
    </div>
  );
}
