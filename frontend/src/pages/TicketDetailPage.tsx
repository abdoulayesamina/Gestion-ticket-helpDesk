import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ticketsApi } from "../api/endpoints";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ErrorAlert, Loader } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks";
import { isStaff, ROLE_LABELS, STATUS_LABELS, type Ticket, type TicketStatus } from "../types";
import { formatDateTime } from "../utils";

export function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => ticketsApi.get(ticketId), [ticketId]);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = ticket?.id === ticketId ? ticket : data;

  if (loading && !current) return <Loader />;
  if (error && !current)
    return (
      <>
        <Link to="/tickets" className="back-link">← Retour aux tickets</Link>
        <ErrorAlert error={error} onRetry={reload} />
      </>
    );
  if (!current) return null;

  const staff = isStaff(user);
  const canDelete = user?.role === "admin" || current.requester.id === user?.id;
  const canEdit = staff || current.requester.id === user?.id;

  const changeStatus = async (status: TicketStatus) => {
    setBusy(true);
    setActionError(null);
    try {
      setTicket(await ticketsApi.update(current.id, { status }));
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await ticketsApi.remove(current.id);
      navigate("/tickets", { replace: true });
    } catch (err) {
      setActionError(err);
      setConfirmOpen(false);
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/tickets" className="back-link">← Retour aux tickets</Link>

      <div className="page-header">
        <div>
          <p className="muted">Ticket #{current.id}</p>
          <h1>{current.title}</h1>
          <div className="badges-row">
            <StatusBadge status={current.status} />
            <PriorityBadge priority={current.priority} />
          </div>
        </div>
        <div className="actions">
          {canEdit && (
            <Link to={`/tickets/${current.id}/modifier`} className="btn btn-secondary">
              Modifier
            </Link>
          )}
          {canDelete && (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
              Supprimer
            </button>
          )}
        </div>
      </div>

      <ErrorAlert error={actionError} />

      <div className="detail-grid">
        <section className="card">
          <h2>Description</h2>
          <p className="description">{current.description}</p>
        </section>

        <aside className="card">
          <h2>Informations</h2>
          <dl className="meta-list">
            <dt>Demandeur</dt>
            <dd>
              {current.requester.full_name}
              <span className="muted small">
                {current.requester.email} · {ROLE_LABELS[current.requester.role]}
              </span>
            </dd>
            <dt>Créé le</dt>
            <dd>{formatDateTime(current.created_at)}</dd>
            <dt>Dernière mise à jour</dt>
            <dd>{formatDateTime(current.updated_at)}</dd>
          </dl>

          {staff && (
            <div className="status-actions">
              <h3>Changer le statut</h3>
              <div className="segmented">
                {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={current.status === s ? "active" : ""}
                    disabled={busy || current.status === s}
                    onClick={() => changeStatus(s)}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer ce ticket ?"
        message={`Le ticket #${current.id} « ${current.title} » sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
