import { useMemo } from "react";
import type { StatChartRenderer } from "../types";
import { CategoryValueBarChart } from "../categoryValueBarChart";

type Row = {
  gradYear: number;
  testType: string;
  avgImprovement: number;
  studentCount: number;
};

const Chart: StatChartRenderer = ({ data, isolateTestType }) => {
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let list = data as Row[];
    if (isolateTestType != null) {
      list = list.filter((r) => r.testType === isolateTestType);
    }
    return list.map((r) => ({
      category: String(r.gradYear),
      avgImprovement: r.avgImprovement,
    }));
  }, [data, isolateTestType]);

  return (
    <CategoryValueBarChart
      data={rows}
      categoryKey="category"
      valueKey="avgImprovement"
      ariaLabel="Average TOTAL improvement by graduation year"
    />
  );
};

export default Chart;
