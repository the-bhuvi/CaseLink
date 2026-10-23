from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .models import CaseStatus, ReviewStatus, Role, Visibility


class ErrorDetail(BaseModel):
    code: str
    message: str
    fields: dict = {}


class ErrorResponse(BaseModel):
    detail: ErrorDetail


class DemoLoginRequest(BaseModel):
    email: str
    display_name: str | None = None
    role: Role = Role.complainant
    bureau_code: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    display_name: str
    role: Role
    bureau_code: str | None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class ComplaintCreate(BaseModel):
    institution_name: str = Field(min_length=2, max_length=255)
    institution_permanent_id: str | None = None
    category: str = Field(min_length=2, max_length=100)
    subject: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=10)
    source_channel: str = "web"


class CasePatch(BaseModel):
    status: CaseStatus | None = None
    priority: str | None = None
    next_action: str | None = None
    due_at: datetime | None = None
    assigned_bureau: str | None = None


class ActionCreate(BaseModel):
    action_type: str
    description: str = Field(min_length=1)
    visibility: Visibility = Visibility.internal
    new_status: CaseStatus | None = None


class AssignmentCreate(BaseModel):
    assigned_to: UUID
    bureau_code: str


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    reference: str
    institution_id: UUID | None
    institution_name: str
    institution_permanent_id: str | None
    category: str
    subject: str
    assigned_bureau: str
    assigned_officer_id: UUID | None
    status: CaseStatus
    priority: str
    received_at: datetime
    updated_at: datetime
    due_at: datetime | None
    closed_at: datetime | None
    age_days: int
    public_status: str


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
    page: int
    page_size: int


class InstitutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    aicte_permanent_id: str | None
    name: str
    state: str
    district: str
    institution_type: str


class TimelineItem(BaseModel):
    id: UUID
    action_type: str
    description: str
    previous_status: str | None
    new_status: str | None
    created_at: datetime


class RelationshipCreate(BaseModel):
    case_id: UUID
    related_case_id: UUID
    review_status: ReviewStatus = ReviewStatus.pending
    match_explanation: str = ""
    evidence_signals: list[str] = []


class RelationshipReview(BaseModel):
    decision: ReviewStatus
    reason: str = Field(min_length=1)


class RelationshipResponse(BaseModel):
    id: UUID
    case_a: CaseResponse
    case_b: CaseResponse
    semantic_similarity: float | None
    relationship_score: float | None
    review_status: ReviewStatus
    explanation: str
    evidence_signals: list[str]
    model_version: str | None
    created_at: datetime
    reviewed_at: datetime | None

