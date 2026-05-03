import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { StatChartRenderer } from "./types";
import {
  STATS_CHART_LEGEND_TOP,
  STATS_CHART_NO_SERIES_ANIMATION,
  STATS_CHART_NO_TOOLTIP_ANIMATION,
} from "./constants";
import {
  STATS_CHART_TOOLTIP_CONTENT,
  formatTooltipNumber,
} from "./tooltipStyles";
import { StatsResponsiveContainer } from "./StatsResponsiveContainer";

type HeadlineRow = {
  testType: string;
  studentCount: number;
  avgBaselineTotal: number;
  avgLatestTotal: number;
  avgImprovement: number;
  avgTutoringHours: number;
  avgPrepWeeks: number;
  completionRate: number;
};

function isHeadline(o: unknown): o is HeadlineRow {
  return !!o && typeof o === "object" && typeof (o as HeadlineRow).testType === "string";
}

export const SummaryHeadlineChart: StatChartRenderer = ({ data }) => {
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(isHeadline).map((r) => ({
      testType: r.testType,
      "Avg TOTAL improvement": r.avgImprovement,
      "Avg tutoring hrs": r.avgTutoringHours,
      "Avg prep (wk)": r.avgPrepWeeks,
      "Completion %": Math.round(r.completionRate * 1000) / 10,
    }));
  }, [data]);

  const cardsSource = Array.isArray(data) ? data.filter(isHeadline) : [];

  if (rows.length === 0 || cardsSource.length === 0) {
    return <p className="stats-chart__empty">No summary data.</p>;
  }

  return (
    <div className="stats-chart stats-chart--summary">
      <div className="stats-summary-cards">
        {cardsSource.map((r) => (
          <article key={r.testType} className="stats-summary-card">
            <h4 className="stats-summary-card__title">{r.testType}</h4>
            <p className="stats-summary-card__metric">
              {r.avgImprovement.toFixed(1)}
              <span className="stats-summary-card__unit">Δ TOTAL avg</span>
            </p>
            <dl className="stats-summary-card__dl">
              <div>
                <dt>Tracks</dt>
                <dd>{r.studentCount}</dd>
              </div>
              <div>
                <dt>Baseline → latest avg</dt>
                <dd>
                  {r.avgBaselineTotal.toFixed(0)} → {r.avgLatestTotal.toFixed(0)}
                </dd>
              </div>
              <div>
                <dt>Completion rate</dt>
                <dd>{(r.completionRate * 100).toFixed(1)}%</dd>
              </div>
              <div>
                <dt>Avg tutoring / prep</dt>
                <dd>
                  {r.avgTutoringHours.toFixed(1)} hrs · {r.avgPrepWeeks.toFixed(1)} wk
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="stats-chart__inner">
        <StatsResponsiveContainer width="100%" height={280}>
          <BarChart margin={{ top: 36, right: 12, bottom: 28, left: 8 }} data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
            <XAxis dataKey="testType" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
            <Legend
              {...STATS_CHART_LEGEND_TOP}
              wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
            />
            <Tooltip
              {...STATS_CHART_NO_TOOLTIP_ANIMATION}
              contentStyle={STATS_CHART_TOOLTIP_CONTENT}
              formatter={(value) => formatTooltipNumber(value)}
            />
            <Bar
              {...STATS_CHART_NO_SERIES_ANIMATION}
              dataKey="Avg TOTAL improvement"
              fill="#8884d8"
            />
            <Bar
              {...STATS_CHART_NO_SERIES_ANIMATION}
              dataKey="Avg tutoring hrs"
              fill="#82ca9d"
            />
            <Bar
              {...STATS_CHART_NO_SERIES_ANIMATION}
              dataKey="Avg prep (wk)"
              fill="#ffc658"
            />
          </BarChart>
        </StatsResponsiveContainer>
      </div>
    </div>
  );
};
