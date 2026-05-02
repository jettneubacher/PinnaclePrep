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

type CellPopover = {
  text: string;
  anchorX: number;
  anchorTop: number;
};

export default function DataCsvTable({ dataset }: { dataset: CsvDataset }) {
  const { columnWidthsByFile, setColumnWidthsForFile } = useDataPage();
  const cols = columnOrder(dataset);
  const colsKey = cols.join("\0");
  const persistedForFile = columnWidthsByFile[dataset.fileName];
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [popover, setPopover] = useState<CellPopover | null>(null);
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
        const rect = el.getBoundingClientRect();
        setPopover({
          text,
          anchorX: rect.left + rect.width / 2,
          anchorTop: rect.bottom,
        });
      });
    },
    [],
  );

  const onCellMouseLeave = useCallback(() => {
    setPopover(null);
  }, []);

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
            <div
              className="data-cell-popover"
              style={{
                left: popover.anchorX,
                top: popover.anchorTop + 6,
              }}
            >
              {popover.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
