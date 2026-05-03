import { useMemo } from "react";
import type { StatChartRenderer } from "../types";
import { CategoryValueBarChart } from "../categoryValueBarChart";

type Row = { completion: string; avgHours: number; studentCount: number };

const Chart: StatChartRenderer = ({ data }) => {
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return (data as Row[]).map((r) => ({
      category: r.completion.trim() || "(blank)",
      avgHours: r.avgHours,
    }));
  }, [data]);

  return (
    <CategoryValueBarChart
      data={rows}
      categoryKey="category"
      valueKey="avgHours"
      ariaLabel="Average tutoring hours by completion label"
      tickFormatterCategory={(v) => v.slice(0, 24)}
    />
  );
};

export default Chart;
