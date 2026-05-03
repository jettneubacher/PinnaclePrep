import type { StatChartRenderer } from "../types";
import { SectionImprovementScatterChart } from "../sectionScatterChart";

const Chart: StatChartRenderer = ({ data, isolateTestType }) => (
  <SectionImprovementScatterChart
    data={data}
    isolateTestType={isolateTestType}
    xKey="remotePercent"
    yKey="delta"
    xAxisLabel="Remote %"
    yAxisLabel="Δ points"
  />
);

export default Chart;
