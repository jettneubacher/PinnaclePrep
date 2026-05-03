import type { StatChartRenderer } from "../types";
import { CompletionOverallPie } from "../completionOverallPie";

const Chart: StatChartRenderer = ({ data }) => <CompletionOverallPie data={data} />;

export default Chart;
