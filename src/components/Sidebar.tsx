import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useState,
  type ReactNode,
} from "react";

export type SidebarHeaderRenderProps = {
  collapsed: boolean;
  toggle: () => void;
};

export type SidebarProps = {
  children: ReactNode;
  /** Top row (e.g. search + collapse). If omitted, only the collapse control is shown. */
  renderHeader?: (props: SidebarHeaderRenderProps) => ReactNode;
  /** `end` places the divider on the left (second sidebar on the right). */
  position?: "start" | "end";
  /** When collapsed, omit the body entirely (nothing hidden under overflow). */
  unloadContentWhenCollapsed?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  toggleAriaLabelExpanded?: string;
  toggleAriaLabelCollapsed?: string;
};

export default function Sidebar({
  children,
  renderHeader,
  position = "start",
  unloadContentWhenCollapsed = false,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  toggleAriaLabelExpanded = "Collapse sidebar",
  toggleAriaLabelCollapsed = "Expand sidebar",
}: SidebarProps) {
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? innerCollapsed;

  const setCollapsed = useCallback(
    (next: boolean) => {
      onCollapsedChange?.(next);
      if (collapsedProp === undefined) {
        setInnerCollapsed(next);
      }
    },
    [collapsedProp, onCollapsedChange],
  );

  const toggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const headerContext: SidebarHeaderRenderProps = { collapsed, toggle };

  const ExpandIcon = position === "end" ? ChevronLeft : ChevronRight;
  const CollapseIcon = position === "end" ? ChevronRight : ChevronLeft;

  const headerInner = renderHeader ? (
    renderHeader(headerContext)
  ) : (
    <div className="sidebar__header-row sidebar__header-row--toggle-only">
      <button
        type="button"
        className="sidebar__toggle"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? toggleAriaLabelCollapsed : toggleAriaLabelExpanded}
      >
        {collapsed ? (
          <ExpandIcon size={18} strokeWidth={2} aria-hidden />
        ) : (
          <CollapseIcon size={18} strokeWidth={2} aria-hidden />
        )}
      </button>
    </div>
  );

  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}${position === "end" ? " sidebar--end" : ""}`}
      aria-label="Side panel"
    >
      <div className="sidebar__header">{headerInner}</div>
      {!(unloadContentWhenCollapsed && collapsed) ? (
        <div className="sidebar__content" aria-hidden={collapsed}>
          {children}
        </div>
      ) : null}
    </aside>
  );
}
