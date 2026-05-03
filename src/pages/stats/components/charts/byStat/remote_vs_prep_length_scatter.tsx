import type { StatChartRenderer } from "../types";
import { ScatterByTestTypeChart } from "../scatterByTestTypeChart";

const Chart: StatChartRenderer = ({ data }) => (
  <ScatterByTestTypeChart
    data={data}
    xKey="remotePercent"
    yKey="prepLengthWeeks"
    xAxisLabel="Remote %"
    yAxisLabel="Prep (weeks)"
  />
);

export default Chart;
