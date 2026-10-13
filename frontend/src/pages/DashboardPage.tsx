import { Link } from "react-router-dom";
import { ticketsApi } from "../api/endpoints";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { EmptyState, ErrorAlert, Loader } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks";
import { PRIORITY_LABELS, type TicketPriority } from "../types";
import { formatRelative } from "../utils";

const PRIORITY_ORDER: TicketPriority[] = ["critical", "high", "medium", "low"];

export function DashboardPage() {
  const { user } = useAuth();
  const stats = useAsync(() => ticketsApi.stats(), []);
  const recent = useAsync(() => ticketsApi.list(), []);

  const reload = () => {
    stats.reload();
    recent.reload();
  };

  const error = stats.error ?? recent.error;
  const maxPriority = stats.data ? Math.max(1, ...Object.values(stats.data.by_priority)) : 1;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="muted">Bonjour {user?.full_name.split(" ")[0]}, voici l'état du support.</p>
        </div>
        <Link to="/tickets/nouveau" className="btn btn-primary">
          + Nouveau ticket
        </Link>
      </div>

      {error ? <ErrorAlert error={error} onRetry={reload} /> : null}

      {stats.loading && !stats.data ? (
        <Loader />
      ) : stats.data ? (
        <>
          <div className="stats-grid">
            <Link to="/tickets?status=open" className="stat-card stat-open">
              <span className="stat-label">Ouverts</span>
              <span className="stat-value">{stats.data.open}</span>
            </Link>
            <Link to="/tickets?status=in_progress" className="stat-card stat-in_progress">
              <span className="stat-label">En cours</span>
              <span className="stat-value">{stats.data.in_progress}</span>
            </Link>
            <Link to="/tickets?status=resolved" className="stat-card stat-resolved">
              <span className="stat-label">Résolus</span>
              <span className="stat-value">{stats.data.resolved}</span>
            </Link>
            <Link to="/tickets" className="stat-card stat-total">
              <span className="stat-label">Total</span>
              <span className="stat-value">{stats.data.total}</span>
            </Link>
          </div>

          <div className="dashboard-grid">
            <section className="card">
              <h2>Répartition par priorité</h2>
              <ul className="bars">
                {PRIORITY_ORDER.map((p) => (
                  <li key={p}>
                    <Link to={`/tickets?priority=${p}`} className="bar-label">
                      {PRIORITY_LABELS[p]}
                    </Link>
                    <div className="bar-track">
                      <div
                        className={`bar-fill bar-${p}`}
                        style={{ width: `${(stats.data!.by_priority[p] / maxPriority) * 100}%` }}
                      />
                    </div>
                    <span className="bar-value">{stats.data!.by_priority[p]}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Tickets récents</h2>
                <Link to="/tickets">Tout voir →</Link>
              </div>
              {recent.data && recent.data.items.length === 0 ? (
                <EmptyState title="Aucun ticket pour le moment" />
              ) : (
                <ul className="recent-list">
                  {recent.data?.items.slice(0, 6).map((t) => (
                    <li key={t.id}>
                      <Link to={`/tickets/${t.id}`}>
                        <span className="recent-title">
                          <span className="muted">#{t.id}</span> {t.title}
                        </span>
                        <span className="recent-meta">
                          <PriorityBadge priority={t.priority} />
                          <StatusBadge status={t.status} />
                          <span className="muted small">{formatRelative(t.created_at)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}
