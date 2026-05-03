import type { StatChartRenderer } from "../types";
import { ScatterByTestTypeChart } from "../scatterByTestTypeChart";

const Chart: StatChartRenderer = ({ data, isolateTestType }) => (
  <ScatterByTestTypeChart
    data={data}
    xKey="prepLengthWeeks"
    yKey="improvement"
    xAxisLabel="Prep (weeks)"
    yAxisLabel="TOTAL Δ pts"
    isolateTestType={isolateTestType}
  />
);

export default Chart;
