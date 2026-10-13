from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import TicketPriority, TicketStatus, UserRole


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+$")
    password: str = Field(min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TicketBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1, max_length=10_000)
    priority: TicketPriority = TicketPriority.medium


class TicketCreate(TicketBase):
    status: TicketStatus = TicketStatus.open


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=10_000)
    priority: TicketPriority | None = None
    status: TicketStatus | None = None


class TicketOut(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    requester: UserOut


class TicketList(BaseModel):
    items: list[TicketOut]
    total: int


class TicketStats(BaseModel):
    open: int
    in_progress: int
    resolved: int
    total: int
    by_priority: dict[str, int]
