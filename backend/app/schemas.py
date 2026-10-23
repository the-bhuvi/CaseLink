from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    institution_id: UUID | None = None
    institution_name: str = Field(min_length=2, max_length=255)
    institution_permanent_id: str | None = None
    category: str = Field(min_length=2, max_length=100)
    subcategory: str | None = Field(default=None, max_length=150)
    specific_issue: str | None = Field(default=None, max_length=150)
    state: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    subject: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=10)
    source_channel: str = "web"
    complainant_name: str | None = None
    complainant_email: str | None = None


class InstitutionVerificationRequest(BaseModel):
    submitted_name: str = Field(min_length=2, max_length=255)
    state: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    details: str = Field(min_length=10, max_length=2000)
    contact_email: str | None = None


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
    subcategory: str | None = None
    specific_issue: str | None = None
    state: str | None = None
    district: str | None = None
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
