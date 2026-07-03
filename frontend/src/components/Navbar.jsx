export default function Navbar({ sidebarOpen, onSidebarToggle, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar-title">
        <button
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? "Close navigation panel" : "Open navigation panel"}
          className="sidebar-toggle"
          title={sidebarOpen ? "Close navigation panel" : "Open navigation panel"}
          type="button"
          onClick={onSidebarToggle}
        >
          <span />
          <span />
          <span />
        </button>
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Companies</h1>
        </div>
      </div>
      <button className="primary-button logout-button" type="button" onClick={onLogout}>
        Logout
      </button>
    </header>
  );
}
