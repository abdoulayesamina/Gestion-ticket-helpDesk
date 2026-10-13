import { useEffect, useState } from "react";
import { checkSystem, type SystemState } from "../api/endpoints";

const LABELS: Record<SystemState | "checking", string> = {
  checking: "Vérification…",
  ok: "Système opérationnel",
  db_down: "Base de données indisponible",
  api_down: "API injoignable",
};

/** Indicateur d'état basé sur l'endpoint /ready, rafraîchi toutes les 30 s. */
export function SystemStatus() {
  const [state, setState] = useState<SystemState | "checking">("checking");

  useEffect(() => {
    let active = true;
    const poll = () => checkSystem().then((s) => active && setState(s));
    poll();
    const id = window.setInterval(poll, 30_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <span className={`system-status system-status-${state}`} title="État de l'API et de PostgreSQL (/ready)">
      <span className="dot" aria-hidden="true" />
      {LABELS[state]}
    </span>
  );
}
