import type { ReactNode } from "react";
import type { TestType } from "../../../calculations/functions/contextTypes";
import { useStatsPage } from "../../../context/StatsPageContext";

export function ChartTestTypeShell({
  showRadios,
  children,
}: {
  showRadios: boolean;
  children: (isolateTestType: TestType | undefined) => ReactNode;
}) {
  const { statsChartTestType } = useStatsPage();

  if (!showRadios) {
    return <>{children(undefined)}</>;
  }

  return <>{children(statsChartTestType)}</>;
}
