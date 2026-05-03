import { type ReactNode, useMemo } from "react";
import { createAnimateManager } from "recharts/es6/animation/AnimationManager";
import { AnimationManagerContext } from "recharts/es6/animation/useAnimationManager";

/**
 * Executes scheduled steps without requestAnimationFrame (one rAF storm per chart on resize/update).
 */
class ImmediateTimeoutController {
  setTimeout(callback: (time: number) => void, delay = 0): () => void {
    if (delay <= 0) {
      queueMicrotask(() => {
        callback(performance.now());
      });
      return () => {};
    }
    const id = window.setTimeout(() => {
      callback(performance.now());
    }, delay);
    return () => window.clearTimeout(id);
  }
}

/**
 * Recharts v3 runs JS tweens through AnimationManager + rAF. Wrapping each chart tree with this
 * replaces the default controller so anything that still schedules work flushes cheaply.
 */
export function StatsRechartsMount({ children }: { children: ReactNode }) {
  const factory = useMemo(
    () => (_animationId: string) =>
      createAnimateManager(new ImmediateTimeoutController()),
    [],
  );
  return (
    <AnimationManagerContext.Provider value={factory}>
      {children}
    </AnimationManagerContext.Provider>
  );
}
