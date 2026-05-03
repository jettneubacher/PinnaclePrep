import type { StatChartRenderer } from "../types";
import { CompletionByTestTypePieRow } from "../completionByTestTypePieRow";

const Chart: StatChartRenderer = ({ data, isolateTestType }) => (
  <CompletionByTestTypePieRow data={data} isolateTestType={isolateTestType} />
);

export default Chart;
