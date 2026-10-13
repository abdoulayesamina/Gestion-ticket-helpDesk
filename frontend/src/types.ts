export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type UserRole = "admin" | "agent" | "user";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  requester: User;
}

export interface TicketList {
  items: Ticket[];
  total: number;
}

export interface TicketStats {
  open: number;
  in_progress: number;
  resolved: number;
  total: number;
  by_priority: Record<TicketPriority, number>;
}

export interface TicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  status?: TicketStatus;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  critical: "Critique",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  agent: "Agent support",
  user: "Utilisateur",
};

export const isStaff = (user: User | null) => user?.role === "admin" || user?.role === "agent";
