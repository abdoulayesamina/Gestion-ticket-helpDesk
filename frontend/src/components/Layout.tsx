import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../types";
import { SystemStatus } from "./SystemStatus";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/connexion");
  };

  const initials = user?.full_name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <img src="/favicon.svg" alt="" width={32} height={32} />
          <span>HelpDesk</span>
        </div>
        <nav onClick={() => setMenuOpen(false)}>
          <NavLink to="/" end>
            Tableau de bord
          </NavLink>
          <NavLink to="/tickets" end>
            Tickets
          </NavLink>
          <NavLink to="/tickets/nouveau">Nouveau ticket</NavLink>
        </nav>
        <div className="sidebar-footer">
          <SystemStatus />
        </div>
      </aside>
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button type="button" className="menu-toggle" aria-label="Ouvrir le menu" onClick={() => setMenuOpen((o) => !o)}>
            ☰
          </button>
          <div className="topbar-spacer" />
          {user && (
            <div className="user-menu">
              <div className="avatar" aria-hidden="true">
                {initials}
              </div>
              <div className="user-info">
                <strong>{user.full_name}</strong>
                <span>{ROLE_LABELS[user.role]}</span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
          )}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
