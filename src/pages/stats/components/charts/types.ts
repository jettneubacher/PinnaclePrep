import type React from "react";
import type { TestType } from "../../../../calculations/functions/contextTypes";

export type StatChartRenderer = React.FC<{
  data: unknown;
  isolateTestType?: TestType;
}>;
