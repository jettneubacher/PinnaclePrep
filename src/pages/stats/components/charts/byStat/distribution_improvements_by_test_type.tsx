import type { StatChartRenderer } from "../types";
import { DistributionHistogramChart } from "../distributionHistogramChart";

const Chart: StatChartRenderer = ({ data, isolateTestType }) => (
  <DistributionHistogramChart
    data={data}
    valueArrayKey="improvements"
    isolateTestType={isolateTestType}
  />
);

export default Chart;
