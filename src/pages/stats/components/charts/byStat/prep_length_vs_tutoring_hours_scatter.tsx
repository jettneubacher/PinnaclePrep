import type { StatChartRenderer } from "../types";
import { SimpleScatterChart } from "../simpleScatterChart";

const Chart: StatChartRenderer = ({ data }) => (
  <SimpleScatterChart
    data={data}
    xKey="prepLengthWeeks"
    yKey="tutoringHours"
    xAxisLabel="Prep (weeks)"
    yAxisLabel="Tutoring hours"
    fill="#82ca9d"
  />
);

export default Chart;
