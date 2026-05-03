import { useMemo } from "react";
import type { StatChartRenderer } from "../types";
import { CategoryValueBarChart } from "../categoryValueBarChart";

type Row = {
  testType: string;
  completion: string;
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
    return list
      .filter((r) => (r.completion?.trim().length ?? 0) > 0)
      .map((r) => ({
        category: r.completion.trim(),
        avgImprovement: r.avgImprovement,
      }));
  }, [data, isolateTestType]);

  return (
    <CategoryValueBarChart
      data={rows}
      categoryKey="category"
      valueKey="avgImprovement"
      ariaLabel="Average improvement by completion label"
      tickFormatterCategory={(v) => v.slice(0, 24)}
    />
  );
};

export default Chart;
