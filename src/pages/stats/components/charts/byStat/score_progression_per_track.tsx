import type { StatChartRenderer } from "../types";
import { ScoreProgressionLineChart } from "../scoreProgressionLineChart";

const Chart: StatChartRenderer = ({ data, isolateTestType }) => (
  <ScoreProgressionLineChart data={data} isolateTestType={isolateTestType} />
);

export default Chart;
