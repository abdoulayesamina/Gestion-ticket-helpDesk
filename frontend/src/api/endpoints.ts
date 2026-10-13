import type { Ticket, TicketInput, TicketList, TicketPriority, TicketStats, TicketStatus, User } from "../types";
import { API_URL, apiRequest } from "./client";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiRequest<User>("/api/auth/me"),
};

export interface TicketFilters {
  status?: TicketStatus | "";
  priority?: TicketPriority | "";
  q?: string;
}

export const ticketsApi = {
  list: (filters: TicketFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.q?.trim()) params.set("q", filters.q.trim());
    params.set("limit", "200");
    return apiRequest<TicketList>(`/api/tickets?${params.toString()}`);
  },
  stats: () => apiRequest<TicketStats>("/api/tickets/stats"),
  get: (id: number) => apiRequest<Ticket>(`/api/tickets/${id}`),
  create: (data: TicketInput) => apiRequest<Ticket>("/api/tickets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<TicketInput>) =>
    apiRequest<Ticket>(`/api/tickets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => apiRequest<void>(`/api/tickets/${id}`, { method: "DELETE" }),
};

export type SystemState = "ok" | "db_down" | "api_down";

/** Interroge /ready pour connaître l'état de l'API et de la base. */
export async function checkSystem(): Promise<SystemState> {
  try {
    const res = await fetch(`${API_URL}/ready`, { cache: "no-store" });
    return res.ok ? "ok" : "db_down";
  } catch {
    return "api_down";
  }
}
