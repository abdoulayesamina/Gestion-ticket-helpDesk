import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorAlert } from "../components/Feedback";
import { SystemStatus } from "../components/SystemStatus";

const DEMO_ACCOUNTS = [
  { email: "admin@helpdesk.local", password: "admin123", label: "Administrateur", name: "Alice Martin" },
  { email: "agent@helpdesk.local", password: "agent123", label: "Agent support", name: "Karim Benali" },
  { email: "user@helpdesk.local", password: "user123", label: "Utilisateur", name: "Sophie Durand" },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const doLogin = async (e: string, p: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(e, p);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(new Error("Veuillez saisir votre email et votre mot de passe."));
      return;
    }
    doLogin(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="brand brand-lg">
          <img src="/favicon.svg" alt="" width={40} height={40} />
          <span>HelpDesk</span>
        </div>
        <p className="muted">Connectez-vous pour gérer les demandes de support.</p>

        <ErrorAlert error={error} />

        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="email">Adresse email</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>Comptes de démonstration</h3>
          <ul>
            {DEMO_ACCOUNTS.map((acc) => (
              <li key={acc.email}>
                <button
                  type="button"
                  className="demo-account"
                  disabled={submitting}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    doLogin(acc.email, acc.password);
                  }}
                >
                  <strong>{acc.label}</strong>
                  <span>
                    {acc.email} / {acc.password}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="login-footer">
          <SystemStatus />
        </div>
      </div>
    </div>
  );
}
