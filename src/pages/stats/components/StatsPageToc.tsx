import { useCallback } from "react";
import type { StatConfig } from "../../../calculations/stats";
import type { StatRunResult } from "../../../calculations/pipeline";

type Props = {
  defs: StatConfig[];
  statResultsById: ReadonlyMap<string, StatRunResult>;
};

export function StatsPageToc({ defs, statResultsById }: Props) {
  const scrollTo = useCallback((id: string) => {
    document
      .getElementById(`stat-section-${id}`)
      ?.scrollIntoView({ behavior: "auto", block: "start" });
  }, []);

  return (
    <div className="stats-page__toc-body">
      <ul className="stats-page__toc-list">
        {defs.map((def) => {
          const run = statResultsById.get(def.id);
          const label = run?.label ?? def.label;
          return (
            <li key={def.id} className="stats-page__toc-item">
              <button
                type="button"
                className="stats-page__toc-link"
                onClick={() => scrollTo(def.id)}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
