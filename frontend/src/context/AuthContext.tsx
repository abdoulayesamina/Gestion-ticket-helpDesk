import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/endpoints";
import { ApiError, setUnauthorizedHandler, tokenStore } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Erreur rencontrée lors de la restauration de session (backend indisponible, etc.) */
  initError: ApiError | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setInitError(null);
    authApi
      .me()
      .then(setUser)
      .catch((err: ApiError) => {
        if (err.kind === "auth") logout();
        else setInitError(err);
      })
      .finally(() => setLoading(false));
  }, [attempt, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    tokenStore.set(res.access_token);
    setUser(res.user);
    setInitError(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, initError, login, logout, retry: () => setAttempt((a) => a + 1) }),
    [user, loading, initError, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
