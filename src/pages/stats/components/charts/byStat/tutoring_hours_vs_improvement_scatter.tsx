import type { StatChartRenderer } from "../types";
import { ScatterByTestTypeChart } from "../scatterByTestTypeChart";

const Chart: StatChartRenderer = ({ data, isolateTestType }) => (
  <ScatterByTestTypeChart
    data={data}
    xKey="tutoringHours"
    yKey="improvement"
    xAxisLabel="Tutoring hours"
    yAxisLabel="TOTAL Δ pts"
    isolateTestType={isolateTestType}
  />
);

export default Chart;
