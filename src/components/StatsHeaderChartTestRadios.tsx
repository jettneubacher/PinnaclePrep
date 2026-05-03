import { isTauri } from "@tauri-apps/api/core";
import { useLocation } from "react-router-dom";
import {
  TEST_TYPES,
  type TestType,
} from "../calculations/functions/contextTypes";
import { useStatsPage } from "../context/StatsPageContext";

/** ACT / SAT / PSAT segmented control shown in app header only on Stats when charts are active. */
export function StatsHeaderChartTestRadios() {
  const { pathname } = useLocation();
  const {
    csvSelectionCount,
    studentSelectionCount,
    statResultsById,
    statsChartTestType,
    setStatsChartTestType,
  } = useStatsPage();

  const onStatsRoute = pathname === "/stats";
  const blocked = csvSelectionCount === 0 || studentSelectionCount === 0;
  const showRadios =
    onStatsRoute &&
    isTauri() &&
    !blocked &&
    statResultsById != null;

  if (!showRadios) return null;

  return (
    <div
      className="stats-chart__test-toggle-group app-header__chart-test-radios"
      role="radiogroup"
      aria-label="Standardized test type for charts"
    >
      {TEST_TYPES.map((tt) => {
        const pressed = statsChartTestType === tt;
        return (
          <button
            key={tt}
            type="button"
            role="radio"
            aria-checked={pressed}
            className={`stats-chart__test-toggle${pressed ? " stats-chart__test-toggle--pressed" : ""}`}
            onClick={() => setStatsChartTestType(tt as TestType)}
          >
            {tt}
          </button>
        );
      })}
    </div>
  );
}
