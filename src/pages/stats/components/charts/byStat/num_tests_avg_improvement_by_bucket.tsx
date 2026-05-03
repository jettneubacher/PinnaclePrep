import { useMemo } from "react";
import type { StatChartRenderer } from "../types";
import { CategoryValueBarChart } from "../categoryValueBarChart";

type Row = {
  testType: string;
  bucket: string;
  avgImprovement: number;
  studentCount?: number;
};

const Chart: StatChartRenderer = ({ data, isolateTestType }) => {
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let list = data as Row[];
    if (isolateTestType != null) {
      list = list.filter((r) => r.testType === isolateTestType);
    }
    return list.map((r) => ({
      category: r.bucket,
      avgImprovement: r.avgImprovement,
    }));
  }, [data, isolateTestType]);

  return (
    <CategoryValueBarChart
      data={rows}
      categoryKey="category"
      valueKey="avgImprovement"
      ariaLabel="Average improvement by num-tests bucket"
    />
  );
};

export default Chart;
