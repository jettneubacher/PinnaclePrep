import { useMemo } from "react";
import type { StatChartRenderer } from "../types";
import { CategoryValueBarChart } from "../categoryValueBarChart";

type Row = {
  gradYear: number;
  avgPrepWeeks: number;
  studentCount: number;
};

const Chart: StatChartRenderer = ({ data }) => {
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return (data as Row[]).map((r) => ({
      category: String(r.gradYear),
      avgPrepWeeks: r.avgPrepWeeks,
    }));
  }, [data]);

  return (
    <CategoryValueBarChart
      data={rows}
      categoryKey="category"
      valueKey="avgPrepWeeks"
      ariaLabel="Average prep weeks by graduation year"
    />
  );
};

export default Chart;
