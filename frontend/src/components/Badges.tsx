import { PRIORITY_LABELS, STATUS_LABELS, type TicketPriority, type TicketStatus } from "../types";

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge badge-status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`badge badge-priority-${priority}`}>
      <span className="dot" aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
