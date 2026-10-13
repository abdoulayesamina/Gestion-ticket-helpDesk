export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const TOKEN_KEY = "helpdesk_token";

export type ApiErrorKind = "network" | "database" | "auth" | "forbidden" | "not_found" | "validation" | "server";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

function extractDetail(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("detail" in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;
  // Erreurs de validation FastAPI : liste d'objets { loc, msg }
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : "";
        return field ? `${field} : ${d?.msg}` : d?.msg;
      })
      .join(" · ");
  }
  return null;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      `Impossible de joindre le serveur (${API_URL}). Vérifiez que le backend est démarré.`,
      "network",
    );
  }

  if (response.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.ok) return body as T;

  const detail = extractDetail(body);
  switch (response.status) {
    case 401:
      if (token) onUnauthorized?.();
      throw new ApiError(detail ?? "Authentification requise.", "auth", 401);
    case 403:
      throw new ApiError(detail ?? "Action non autorisée.", "forbidden", 403);
    case 404:
      throw new ApiError(detail ?? "Ressource introuvable.", "not_found", 404);
    case 422:
      throw new ApiError(detail ?? "Données invalides.", "validation", 422);
    case 503:
      throw new ApiError(
        detail ?? "La base de données est indisponible. Réessayez dans quelques instants.",
        "database",
        503,
      );
    default:
      throw new ApiError(detail ?? `Erreur serveur inattendue (code ${response.status}).`, "server", response.status);
  }
}
