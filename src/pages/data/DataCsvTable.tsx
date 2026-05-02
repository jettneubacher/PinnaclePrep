import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import type { CsvDataset } from "../../context/CsvDataContext";
import { useDataPage } from "../../context/DataPageContext";

const DEFAULT_COL_W = 140;
const MIN_COL_W = 56;
const MAX_COL_W = 720;

function columnOrder(dataset: CsvDataset): string[] {
  if (dataset.fields?.length) {
    return dataset.fields;
  }
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const row of dataset.rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        ordered.push(k);
      }
    }
  }
  return ordered;
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function clampWidth(w: number): number {
  return Math.round(Math.max(MIN_COL_W, Math.min(MAX_COL_W, w)));
}

function scrollableAncestors(start: HTMLElement | null): HTMLElement[] {
  const out: HTMLElement[] = [];
  let el: HTMLElement | null = start;
  while (el) {
    const st = getComputedStyle(el);
    if (
      /(auto|scroll|overlay)/.test(st.overflowY) ||
      /(auto|scroll|overlay)/.test(st.overflowX)
    ) {
      out.push(el);
    }
    el = el.parentElement;
  }
  return out;
}

/** Match `.data-cell-popover` max-width / max-height for placement math. */
function popoverMaxSize(): { w: number; h: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    w: Math.min(28 * 16, vw - 24),
    h: Math.min(vh * 0.4, 18 * 16),
  };
}

const VIEW_MARGIN = 16;
const POPOVER_GAP = 6;
/** Viewport px: cell considered “near” bottom → open popover above. */
const NEAR_BOTTOM_PX = 100;
/** Viewport px: cell considered “near” left/right edge → align popover that way. */
const NEAR_EDGE_PX = 80;

type PopoverPlacementReady =
  | { hAlign: "center"; left: number; top: number; transform: string }
  | { hAlign: "left"; left: number; top: number; transform: string }
  | { hAlign: "right"; left: number; top: number; transform: string };

/** One layout frame: natural-width measure off-screen, then `left = cellRight - width`. */
type CellPopoverMeasureRight = {
  status: "measure-right";
  text: string;
  top: number;
  transform: string;
  cellRight: number;
};

type CellPopoverReady = { status: "ready"; text: string } & PopoverPlacementReady;

type CellPopover = CellPopoverMeasureRight | CellPopoverReady;

/**
 * Vertical and horizontal rules are independent.
 * Near-right uses a measure pass so width is content-sized, then right edge is pinned to the cell.
 */
function placementFromRect(rect: DOMRect):
  | { kind: "measure-right"; top: number; transform: string; cellRight: number }
  | { kind: "ready"; placement: PopoverPlacementReady } {
  const { h: estH } = popoverMaxSize();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = VIEW_MARGIN;

  const nearBottom =
    vh - rect.bottom < NEAR_BOTTOM_PX ||
    rect.bottom + POPOVER_GAP + estH > vh - m;

  const nearRight = rect.right > vw - NEAR_EDGE_PX;
  const nearLeft = rect.left < NEAR_EDGE_PX;

  const top = nearBottom ? rect.top - POPOVER_GAP : rect.bottom + POPOVER_GAP;
  const ty = nearBottom ? "-100%" : "0";

  if (nearRight && !nearLeft) {
    return {
      kind: "measure-right",
      top,
      transform: `translate(0, ${ty})`,
      cellRight: rect.right,
    };
  }
  if (nearLeft && !nearRight) {
    return {
      kind: "ready",
      placement: {
        hAlign: "left",
        left: rect.left,
        top,
        transform: `translate(0, ${ty})`,
      },
    };
  }

  const cx = rect.left + rect.width / 2;
  return {
    kind: "ready",
    placement: {
      hAlign: "center",
      left: cx,
      top,
      transform: `translate(-50%, ${ty})`,
    },
  };
}

export default function DataCsvTable({ dataset }: { dataset: CsvDataset }) {
  const { columnWidthsByFile, setColumnWidthsForFile } = useDataPage();
  const cols = columnOrder(dataset);
  const colsKey = cols.join("\0");
  const persistedForFile = columnWidthsByFile[dataset.fileName];
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [popover, setPopover] = useState<CellPopover | null>(null);
  const popoverMeasureRef = useRef<HTMLDivElement | null>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const fileNameRef = useRef(dataset.fileName);
  fileNameRef.current = dataset.fileName;

  useEffect(() => {
    const stored = persistedForFile;
    const next: Record<string, number> = {};
    for (const c of cols) {
      const v = stored?.[c];
      next[c] =
        v != null && Number.isFinite(v) ? clampWidth(v) : DEFAULT_COL_W;
    }
    setWidths(next);
  }, [dataset.fileName, colsKey, persistedForFile]);

  const colWidth = useCallback(
    (c: string) => widths[c] ?? DEFAULT_COL_W,
    [widths],
  );

  const tableWidth = cols.reduce((s, c) => s + colWidth(c), 0);

  const onResizeStart = useCallback(
    (col: string, e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = colWidth(col);
      let lastW = startW;
      const fileName = fileNameRef.current;

      const onMove = (ev: MouseEvent) => {
        lastW = clampWidth(startW + ev.clientX - startX);
        setWidths((prev) => ({ ...prev, [col]: lastW }));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.removeProperty("user-select");
        setWidths((prev) => {
          const next = { ...prev, [col]: lastW };
          setColumnWidthsForFile(fileName, next);
          return next;
        });
      };

      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [colWidth, setColumnWidthsForFile],
  );

  const onCellMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>, text: string) => {
      if (!text) {
        setPopover(null);
        return;
      }
      const el = e.currentTarget;
      window.requestAnimationFrame(() => {
        if (el.scrollWidth <= el.clientWidth + 1) {
          setPopover(null);
          return;
        }
        const td = el.closest("td");
        const rect = td?.getBoundingClientRect() ?? el.getBoundingClientRect();
        const p = placementFromRect(rect);
        setPopover(
          p.kind === "measure-right"
            ? {
                status: "measure-right",
                text,
                top: p.top,
                transform: p.transform,
                cellRight: p.cellRight,
              }
            : {
                status: "ready",
                text,
                ...p.placement,
              },
        );
      });
    },
    [],
  );

  const onCellMouseLeave = useCallback(() => {
    setPopover(null);
  }, []);

  useLayoutEffect(() => {
    if (!popover || popover.status !== "measure-right") return;
    const node = popoverMeasureRef.current;
    if (!node) return;
    const w = node.getBoundingClientRect().width;
    const left = Math.max(VIEW_MARGIN, popover.cellRight - w);
    setPopover({
      status: "ready",
      text: popover.text,
      hAlign: "right",
      left,
      top: popover.top,
      transform: popover.transform,
    });
  }, [popover]);

  useLayoutEffect(() => {
    if (!popover) return;
    const hide = () => setPopover(null);
    const roots = scrollableAncestors(tableWrapRef.current);
    for (const el of roots) {
      el.addEventListener("scroll", hide, { capture: true });
    }
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      for (const el of roots) {
        el.removeEventListener("scroll", hide, { capture: true });
      }
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [popover]);

  return (
    <div className="data-table-wrap" ref={tableWrapRef}>
      <table
        className="data-table"
        style={{ width: tableWidth > 0 ? tableWidth : undefined }}
      >
        <colgroup>
          {cols.map((c) => (
            <col key={c} style={{ width: colWidth(c) }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} className="data-table__th" scope="col">
                <span className="data-table__th-inner">
                  <span className="data-table__th-label" title={c}>
                    {c}
                  </span>
                  <span
                    className="data-table__resize-handle"
                    onMouseDown={(e) => onResizeStart(c, e)}
                    aria-hidden
                  />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataset.rows.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => {
                const text = cellText(row[c]);
                return (
                  <td key={c} className="data-table__td">
                    <span
                      className="data-table__cell-inner"
                      onMouseEnter={(e) => onCellMouseEnter(e, text)}
                      onMouseLeave={onCellMouseLeave}
                    >
                      {text}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {popover != null
        ? createPortal(
            popover.status === "measure-right" ? (
              <div
                ref={popoverMeasureRef}
                className="data-cell-popover"
                aria-hidden
                style={{
                  position: "fixed",
                  left: -10000,
                  top: 0,
                  visibility: "hidden",
                  pointerEvents: "none",
                }}
              >
                {popover.text}
              </div>
            ) : (
              <div
                className="data-cell-popover"
                style={{
                  top: popover.top,
                  left: popover.left,
                  right: "auto",
                  transform: popover.transform,
                }}
              >
                {popover.text}
              </div>
            ),
            document.body,
          )
        : null}
    </div>
  );
}
