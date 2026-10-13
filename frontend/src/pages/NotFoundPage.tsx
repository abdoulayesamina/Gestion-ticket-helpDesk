import { Link } from "react-router-dom";
import { EmptyState } from "../components/Feedback";

export function NotFoundPage() {
  return (
    <EmptyState title="Page introuvable">
      <p className="muted">La page demandée n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn btn-primary">
        Retour au tableau de bord
      </Link>
    </EmptyState>
  );
}
