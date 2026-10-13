import type { ReactNode } from "react";
import { ApiError } from "../api/client";

const TITLES: Record<string, string> = {
  network: "Serveur injoignable",
  database: "Base de données indisponible",
  auth: "Authentification requise",
  forbidden: "Accès refusé",
  not_found: "Introuvable",
  validation: "Données invalides",
  server: "Erreur du serveur",
};

export function ErrorAlert({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) return null;
  const apiError = error instanceof ApiError ? error : null;
  const title = apiError ? TITLES[apiError.kind] : "Erreur";
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="alert alert-error" role="alert">
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export function Loader({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="loader" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
