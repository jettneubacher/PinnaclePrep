import type { StatChartRenderer } from "../types";
import { SectionImprovementScatterChart } from "../sectionScatterChart";

const Chart: StatChartRenderer = ({ data, isolateTestType }) => (
  <SectionImprovementScatterChart
    data={data}
    isolateTestType={isolateTestType}
    xKey="baseline"
    yKey="delta"
    xAxisLabel="Baseline score"
    yAxisLabel="Δ points"
  />
);

export default Chart;
