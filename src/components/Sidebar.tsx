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
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  toggleAriaLabelExpanded?: string;
  toggleAriaLabelCollapsed?: string;
};

export default function Sidebar({
  children,
  renderHeader,
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
          <ChevronRight size={18} strokeWidth={2} aria-hidden />
        ) : (
          <ChevronLeft size={18} strokeWidth={2} aria-hidden />
        )}
      </button>
    </div>
  );

  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}
      aria-label="Side panel"
    >
      <div className="sidebar__header">{headerInner}</div>
      <div className="sidebar__content" aria-hidden={collapsed}>
        {children}
      </div>
    </aside>
  );
}
