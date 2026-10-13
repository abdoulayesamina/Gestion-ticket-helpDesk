import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ticketsApi } from "../api/endpoints";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { EmptyState, ErrorAlert, Loader } from "../components/Feedback";
import { useAsync } from "../hooks";
import { PRIORITY_LABELS, STATUS_LABELS, type TicketPriority, type TicketStatus } from "../types";
import { formatDateTime } from "../utils";

export function TicketListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") ?? "") as TicketStatus | "";
  const priority = (params.get("priority") ?? "") as TicketPriority | "";
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);

  const { data, error, loading, reload } = useAsync(() => ticketsApi.list({ status, priority, q }), [status, priority, q]);

  // Recherche avec un léger délai pour éviter une requête par frappe
  useEffect(() => {
    const id = window.setTimeout(() => setFilter("q", search), 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }

  const hasFilters = !!(status || priority || q);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p className="muted">{data ? `${data.total} ticket${data.total > 1 ? "s" : ""}` : " "}</p>
        </div>
        <Link to="/tickets/nouveau" className="btn btn-primary">
          + Nouveau ticket
        </Link>
      </div>

      <div className="filters card">
        <input
          type="search"
          placeholder="Rechercher un ticket…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher"
        />
        <select value={status} onChange={(e) => setFilter("status", e.target.value)} aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setFilter("priority", e.target.value)} aria-label="Filtrer par priorité">
          <option value="">Toutes les priorités</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSearch("");
              setParams({}, { replace: true });
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {error ? <ErrorAlert error={error} onRetry={reload} /> : null}

      {loading && !data ? (
        <Loader />
      ) : data && data.items.length === 0 ? (
        <EmptyState title={hasFilters ? "Aucun ticket ne correspond à ces filtres" : "Aucun ticket"}>
          <Link to="/tickets/nouveau" className="btn btn-primary">
            Créer un ticket
          </Link>
        </EmptyState>
      ) : data ? (
        <div className={`card table-card ${loading ? "is-loading" : ""}`}>
          <table className="ticket-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Titre</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Demandeur</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td className="muted" data-label="N°">#{t.id}</td>
                  <td data-label="Titre">
                    <Link to={`/tickets/${t.id}`} className="ticket-title" onClick={(e) => e.stopPropagation()}>
                      {t.title}
                    </Link>
                    <span className="ticket-excerpt">{t.description}</span>
                  </td>
                  <td data-label="Priorité">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td data-label="Statut">
                    <StatusBadge status={t.status} />
                  </td>
                  <td data-label="Demandeur">{t.requester.full_name}</td>
                  <td data-label="Créé le" className="nowrap">
                    {formatDateTime(t.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
