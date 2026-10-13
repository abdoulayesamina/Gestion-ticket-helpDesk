from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Ticket, TicketPriority, TicketStatus, User, UserRole
from app.schemas import TicketCreate, TicketList, TicketOut, TicketStats, TicketUpdate
from app.security import get_current_user

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


def _is_staff(user: User) -> bool:
    return user.role in (UserRole.admin, UserRole.agent)


def _visible_tickets(user: User):
    """Les agents et admins voient tout ; un utilisateur ne voit que ses propres tickets."""
    stmt = select(Ticket)
    if not _is_staff(user):
        stmt = stmt.where(Ticket.requester_id == user.id)
    return stmt


def _get_ticket_or_404(ticket_id: int, user: User, db: Session) -> Ticket:
    ticket = db.scalar(_visible_tickets(user).where(Ticket.id == ticket_id))
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket #{ticket_id} introuvable.")
    return ticket


@router.get("", response_model=TicketList, summary="Lister les tickets (avec filtres)")
def list_tickets(
    status_filter: TicketStatus | None = Query(default=None, alias="status", description="Filtrer par statut"),
    priority: TicketPriority | None = Query(default=None, description="Filtrer par priorité"),
    q: str | None = Query(default=None, max_length=100, description="Recherche dans le titre ou la description"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TicketList:
    stmt = _visible_tickets(current_user)
    if status_filter:
        stmt = stmt.where(Ticket.status == status_filter)
    if priority:
        stmt = stmt.where(Ticket.priority == priority)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(or_(Ticket.title.ilike(pattern), Ticket.description.ilike(pattern)))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.order_by(Ticket.created_at.desc(), Ticket.id.desc()).limit(limit).offset(offset)).all()
    return TicketList(items=[TicketOut.model_validate(t) for t in items], total=total)


@router.get("/stats", response_model=TicketStats, summary="Statistiques pour le tableau de bord")
def ticket_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> TicketStats:
    base = _visible_tickets(current_user).subquery()
    by_status = dict(db.execute(select(base.c.status, func.count()).group_by(base.c.status)).all())
    by_priority = dict(db.execute(select(base.c.priority, func.count()).group_by(base.c.priority)).all())
    return TicketStats(
        open=by_status.get(TicketStatus.open, 0),
        in_progress=by_status.get(TicketStatus.in_progress, 0),
        resolved=by_status.get(TicketStatus.resolved, 0),
        total=sum(by_status.values()),
        by_priority={p.value: by_priority.get(p, 0) for p in TicketPriority},
    )


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED, summary="Créer un ticket")
def create_ticket(
    payload: TicketCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Ticket:
    ticket = Ticket(
        title=payload.title.strip(),
        description=payload.description.strip(),
        priority=payload.priority,
        # Seul le personnel support peut créer un ticket directement dans un autre statut
        status=payload.status if _is_staff(current_user) else TicketStatus.open,
        requester_id=current_user.id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}", response_model=TicketOut, summary="Détail d'un ticket")
def get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Ticket:
    return _get_ticket_or_404(ticket_id, current_user, db)


@router.put("/{ticket_id}", response_model=TicketOut, summary="Modifier un ticket")
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    ticket = _get_ticket_or_404(ticket_id, current_user, db)
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "status" in data and data["status"] != ticket.status and not _is_staff(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les agents du support peuvent changer le statut d'un ticket.",
        )
    for field, value in data.items():
        setattr(ticket, field, value.strip() if isinstance(value, str) and field in ("title", "description") else value)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Supprimer un ticket")
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Response:
    ticket = _get_ticket_or_404(ticket_id, current_user, db)
    if current_user.role != UserRole.admin and ticket.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le demandeur ou un administrateur peut supprimer ce ticket.",
        )
    db.delete(ticket)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
