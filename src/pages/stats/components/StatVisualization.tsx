import { memo } from "react";
import { STAT_CHART_REGISTRY } from "./statChartsRegistry";
import { ChartTestTypeShell } from "./ChartTestTypeShell";
import { STAT_IDS_WITH_CHART_TEST_RADIOS } from "./chartTestRadios";

export const StatVisualization = memo(function StatVisualization({
  statId,
  data,
}: {
  statId: string;
  data: unknown;
}) {
  const Chart = STAT_CHART_REGISTRY[statId];
  if (!Chart || data == null) return null;
  const showRadios = STAT_IDS_WITH_CHART_TEST_RADIOS.has(statId);
  return (
    <ChartTestTypeShell showRadios={showRadios}>
      {(isolateTestType) => (
        <Chart data={data} isolateTestType={isolateTestType} />
      )}
    </ChartTestTypeShell>
  );
});
