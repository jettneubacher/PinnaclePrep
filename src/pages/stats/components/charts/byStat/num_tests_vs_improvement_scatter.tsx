import type { StatChartRenderer } from "../types";
import { ScatterByTestTypeChart } from "../scatterByTestTypeChart";

const Chart: StatChartRenderer = ({ data, isolateTestType }) => (
  <ScatterByTestTypeChart
    data={data}
    xKey="numTests"
    yKey="improvement"
    xAxisLabel="NUM TESTS"
    yAxisLabel="TOTAL Δ pts"
    isolateTestType={isolateTestType}
  />
);

export default Chart;
