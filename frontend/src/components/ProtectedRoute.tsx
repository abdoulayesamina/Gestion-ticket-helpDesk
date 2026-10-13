import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorAlert, Loader } from "./Feedback";

export function ProtectedRoute() {
  const { user, loading, initError, retry } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-page"><Loader label="Vérification de la session…" /></div>;
  if (initError)
    return (
      <div className="center-page">
        <div className="card narrow">
          <ErrorAlert error={initError} onRetry={retry} />
        </div>
      </div>
    );
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
