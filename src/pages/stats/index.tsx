import Sidebar from "../../components/Sidebar";

export default function StatsPage() {
  return (
    <div className="with-sidebar">
      <Sidebar
        toggleAriaLabelExpanded="Collapse stats sidebar"
        toggleAriaLabelCollapsed="Expand stats sidebar"
      >
        <div className="stats-sidebar__body">
          <p className="stats-sidebar__placeholder">
            Stats sidebar content (filters, charts, etc.) will go here.
          </p>
        </div>
      </Sidebar>
      <main className="with-sidebar__main stats-page__main">
        <p className="stats-page__placeholder">Stats will go here soon</p>
      </main>
    </div>
  );
}
