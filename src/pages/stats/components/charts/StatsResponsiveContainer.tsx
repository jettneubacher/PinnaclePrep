import type { ComponentProps, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { StatsRechartsMount } from "./StatsRechartsMount";

type Props = ComponentProps<typeof ResponsiveContainer>;

const DEFAULT_DEBOUNCE_MS = 50;

/**
 * Stats charts: shared Recharts animation backend + debounced ResizeObserver to cut jank.
 */
export function StatsResponsiveContainer({
  debounce = DEFAULT_DEBOUNCE_MS,
  children,
  ...rest
}: Props) {
  return (
    <StatsRechartsMount>
      <ResponsiveContainer debounce={debounce} {...rest}>
        {children as ReactNode}
      </ResponsiveContainer>
    </StatsRechartsMount>
  );
}
