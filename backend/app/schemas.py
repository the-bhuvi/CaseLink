from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    institution_name: str = Field(min_length=2, max_length=255)
    institution_permanent_id: str | None = None
    category: str = Field(min_length=2, max_length=100)
    subject: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=10)
    source_channel: str = "web"
    complainant_name: str | None = None
    complainant_email: str | None = None


class CaseActionCreate(BaseModel):
    action_type: str = Field(min_length=1, max_length=50)
    description: str = Field(min_length=1)
    new_status: str | None = None
    next_action: str | None = None
    due_at: datetime | None = None
    visibility: str = "internal"


class RelationshipReview(BaseModel):
    decision: str
    reason: str = Field(min_length=1)


class CaseResponse(BaseModel):
    id: UUID
    reference: str
    institution_id: UUID | None = None
    institution_name: str
    institution_permanent_id: str | None = None
    category: str
    subject: str
    description: str | None = None
    assigned_bureau: str
    assigned_officer_id: UUID | None = None
    status: str
    priority: str
    received_at: datetime
    updated_at: datetime
    due_at: datetime | None = None
    closed_at: datetime | None = None
    age_days: int
    public_status: str
    next_action: str | None = None


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
    page: int
    page_size: int
