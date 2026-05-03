import type { CSSProperties } from "react";

/** Recharts tooltip styling — uses CSS variables so light/dark themes match the app shell. */
export const STATS_CHART_TOOLTIP_CURSOR = {
  strokeDasharray: "3 3" as const,
};

export const STATS_CHART_TOOLTIP_CONTENT: CSSProperties = {
  backgroundColor: "var(--surface-raised)",
  border: "1px solid var(--surface-border)",
  borderRadius: "var(--radius-sm)",
  boxShadow:
    "0 6px 20px color-mix(in srgb, var(--text-primary) 12%, transparent)",
  fontSize: 12,
  color: "var(--text-primary)",
};

export const STATS_CHART_TOOLTIP_LABEL: CSSProperties = {
  color: "var(--text-muted)",
  marginBottom: 4,
};

export const statsChartTooltipOuter = {
  cursor: STATS_CHART_TOOLTIP_CURSOR,
  wrapperStyle: {
    outline: "none",
    zIndex: 10,
  } as CSSProperties,
  contentStyle: STATS_CHART_TOOLTIP_CONTENT,
  labelStyle: STATS_CHART_TOOLTIP_LABEL,
} as const;

export function formatTooltipNumber(value: unknown): string {
  return typeof value === "number" ? value.toLocaleString() : `${value ?? "—"}`;
}
