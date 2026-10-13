import { useState, type FormEvent } from "react";
import { PRIORITY_LABELS, STATUS_LABELS, type TicketInput, type TicketPriority, type TicketStatus } from "../types";
import { ErrorAlert } from "./Feedback";

interface Props {
  initial?: TicketInput;
  canEditStatus: boolean;
  submitLabel: string;
  onSubmit: (data: TicketInput) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: TicketInput = { title: "", description: "", priority: "medium", status: "open" };

export function TicketForm({ initial = EMPTY, canEditStatus, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<TicketInput>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof TicketInput, string>>>({});
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof TicketInput>(key: K, value: TicketInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (form.title.trim().length < 3) next.title = "Le titre doit contenir au moins 3 caractères.";
    if (form.title.length > 200) next.title = "Le titre ne doit pas dépasser 200 caractères.";
    if (!form.description.trim()) next.description = "La description est obligatoire.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: TicketInput = { title: form.title, description: form.description, priority: form.priority };
      if (canEditStatus) payload.status = form.status;
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err);
      setSubmitting(false);
    }
  };

  return (
    <form className="form card" onSubmit={handleSubmit} noValidate>
      <ErrorAlert error={submitError} />

      <div className="field">
        <label htmlFor="title">Titre *</label>
        <input
          id="title"
          value={form.title}
          maxLength={200}
          placeholder="Ex. : Impossible d'accéder à la messagerie"
          onChange={(e) => update("title", e.target.value)}
          aria-invalid={!!errors.title}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="field">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          rows={7}
          value={form.description}
          placeholder="Décrivez le problème, les étapes pour le reproduire et son impact."
          onChange={(e) => update("description", e.target.value)}
          aria-invalid={!!errors.description}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="priority">Priorité</label>
          <select id="priority" value={form.priority} onChange={(e) => update("priority", e.target.value as TicketPriority)}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Statut</label>
          <select
            id="status"
            value={form.status}
            disabled={!canEditStatus}
            onChange={(e) => update("status", e.target.value as TicketStatus)}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {!canEditStatus && <span className="field-hint">Seuls les agents du support peuvent changer le statut.</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Enregistrement…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
