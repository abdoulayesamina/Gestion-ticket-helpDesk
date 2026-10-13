import { Link, useNavigate, useParams } from "react-router-dom";
import { ticketsApi } from "../api/endpoints";
import { ErrorAlert, Loader } from "../components/Feedback";
import { TicketForm } from "../components/TicketForm";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks";
import { isStaff } from "../types";

export function TicketCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <Link to="/tickets" className="back-link">← Retour aux tickets</Link>
      <div className="page-header">
        <h1>Nouveau ticket</h1>
      </div>
      <TicketForm
        canEditStatus={isStaff(user)}
        submitLabel="Créer le ticket"
        onCancel={() => navigate(-1)}
        onSubmit={async (data) => {
          const ticket = await ticketsApi.create(data);
          navigate(`/tickets/${ticket.id}`, { replace: true });
        }}
      />
    </>
  );
}

export function TicketEditPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => ticketsApi.get(ticketId), [ticketId]);

  return (
    <>
      <Link to={`/tickets/${ticketId}`} className="back-link">← Retour au ticket</Link>
      <div className="page-header">
        <h1>Modifier le ticket #{ticketId}</h1>
      </div>
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorAlert error={error} onRetry={reload} />
      ) : data ? (
        <TicketForm
          initial={{ title: data.title, description: data.description, priority: data.priority, status: data.status }}
          canEditStatus={isStaff(user)}
          submitLabel="Enregistrer"
          onCancel={() => navigate(`/tickets/${ticketId}`)}
          onSubmit={async (values) => {
            await ticketsApi.update(ticketId, values);
            navigate(`/tickets/${ticketId}`, { replace: true });
          }}
        />
      ) : null}
    </>
  );
}
