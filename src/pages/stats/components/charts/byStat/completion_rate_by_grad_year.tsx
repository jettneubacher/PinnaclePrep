import { useMemo } from "react";
import type { StatChartRenderer } from "../types";
import { CategoryValueBarChart } from "../categoryValueBarChart";

type Row = {
  gradYear: number;
  complete: number;
  incomplete: number;
  completionRate: number;
};

const Chart: StatChartRenderer = ({ data }) => {
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return (data as Row[]).map((r) => ({
      category: String(r.gradYear),
      completionPct: r.completionRate * 100,
    }));
  }, [data]);

  if (rows.length === 0) {
    return <p className="stats-chart__empty">No graduation-year completion data.</p>;
  }

  return (
    <CategoryValueBarChart
      data={rows}
      categoryKey="category"
      valueKey="completionPct"
      ariaLabel="Completion rate by graduation year"
    />
  );
};

export default Chart;
