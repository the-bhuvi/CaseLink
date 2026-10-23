import csv
import io
import math
import re
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, case as sql_case, func, or_, select
from sqlalchemy.orm import Session

from .auth import create_access_token, current_user, require_roles
from .database import Base, engine, get_db
from .models import AuditEvent, Case, CaseAction, CaseAssignment, CaseRelationship, CaseStatus, Institution, Notification, ReviewStatus, Role, User, Visibility, utcnow
from .schemas import ActionCreate, AssignmentCreate, CaseListResponse, CasePatch, CaseResponse, ComplaintCreate, DemoLoginRequest, InstitutionResponse, RelationshipCreate, RelationshipReview, RelationshipResponse, TimelineItem, TokenResponse, UserResponse
from .services.matching import matching_service, normalize_text

app = FastAPI(title="CASELINK AI API", version="1.0.0", description="Explainable cross-bureau complaint monitoring and coordination API.")


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


def error(code: str, message: str, status: int = 400, fields: dict | None = None) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message, "fields": fields or {}})


def get_case(db: Session, case_id: UUID) -> Case:
    item = db.get(Case, case_id)
    if not item:
        raise error("NOT_FOUND", "Case not found", 404)
    return item


def can_view_case(user: User, item: Case) -> bool:
    return user.role in {Role.officer, Role.supervisor, Role.admin} or item.complainant_id == user.id


def case_response(item: Case) -> CaseResponse:
    now = datetime.now(timezone.utc)
    received = item.received_at
    if received and received.tzinfo is None:
        received = received.replace(tzinfo=timezone.utc)
    age = max(0, (now - received).days) if received else 0
    return CaseResponse(id=item.id, reference=item.reference, institution_id=item.institution_id, institution_name=item.institution.name if item.institution else item.submitted_institution_name, institution_permanent_id=item.submitted_institution_id or (item.institution.aicte_permanent_id if item.institution else None), category=item.category, subject=item.subject, assigned_bureau=item.assigned_bureau, assigned_officer_id=item.assigned_officer_id, status=item.status, priority=item.priority, received_at=item.received_at, updated_at=item.updated_at, due_at=item.due_at, closed_at=item.closed_at, age_days=age, public_status=item.public_status)


def next_reference(db: Session) -> str:
    year = datetime.now(timezone.utc).year
    count = db.scalar(select(func.count(Case.id)).where(Case.reference.like(f"CL-{year}-%"))) or 0
    return f"CL-{year}-{count + 1:05d}"


@app.get("/health")
def health():
    return {"status": "ok", "service": "caselink-api"}


@app.get("/api/v1/health/ready")
def ready(db: Session = Depends(get_db)):
    try:
        db.execute(select(1))
        return {"status": "ready", "database": "ok", "semantic_matching": "ready" if matching_service.ready else "fallback"}
    except Exception as exc:
        raise error("NOT_READY", str(exc), 503)


@app.post("/api/v1/auth/demo-login", response_model=TokenResponse)
def demo_login(request: DemoLoginRequest, db: Session = Depends(get_db)):
    if request.email.lower() not in {"complainant@demo.caselink", "rb.officer@demo.caselink", "pgrc.officer@demo.caselink", "supervisor@demo.caselink", "admin@demo.caselink"}:
        raise error("DEMO_IDENTITY_NOT_ALLOWED", "Use an allowlisted demo identity", 400)
    user = db.scalar(select(User).where(User.email == request.email.lower()))
    if not user:
        user = User(email=request.email.lower(), display_name=request.display_name or request.email.split("@")[0], role=request.role, bureau_code=request.bureau_code)
        db.add(user)
        db.commit()
        db.refresh(user)
    token, expires = create_access_token(user)
    return TokenResponse(access_token=token, expires_in=expires, user=user)


@app.get("/api/v1/auth/me", response_model=UserResponse)
def me(user: User = Depends(current_user)):
    return user


@app.post("/api/v1/public/complaints", response_model=CaseResponse, status_code=201)
def create_complaint(request: ComplaintCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.complainant, Role.officer, Role.supervisor, Role.admin))):
    institution = None
    if request.institution_permanent_id:
        institution = db.scalar(select(Institution).where(Institution.aicte_permanent_id == request.institution_permanent_id))
    if not institution:
        institution = db.scalar(select(Institution).where(Institution.normalized_name == normalize_text(request.institution_name)))
    item = Case(reference=next_reference(db), institution_id=institution.id if institution else None, submitted_institution_name=request.institution_name, submitted_institution_id=request.institution_permanent_id, category=request.category, subject=request.subject, description=request.description, source_channel=request.source_channel, assigned_bureau="RB", complainant_id=user.id if user.role == Role.complainant else None, public_status="Received")
    db.add(item)
    db.flush()
    db.add(CaseAction(case_id=item.id, actor_id=user.id, action_type="submitted", description="Complaint submitted", new_status=item.status, visibility=Visibility.public))
    db.add(AuditEvent(actor_id=user.id, entity_type="case", entity_id=item.id, action="created", after_json={"reference": item.reference}))
    db.commit()
    db.refresh(item)
    return case_response(item)


@app.get("/api/v1/public/my-complaints", response_model=CaseListResponse)
def my_complaints(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), user: User = Depends(current_user)):
    query = select(Case).where(Case.complainant_id == user.id).order_by(Case.received_at.desc())
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()
    return CaseListResponse(items=[case_response(x) for x in items], total=total, page=page, page_size=page_size)


def public_case(case_id: UUID, db: Session, user: User) -> Case:
    item = get_case(db, case_id)
    if item.complainant_id != user.id and user.role not in {Role.officer, Role.supervisor, Role.admin}:
        raise error("FORBIDDEN", "You can access only your own complaint", 403)
    return item


@app.get("/api/v1/public/complaints/{case_id}/timeline", response_model=list[TimelineItem])
def timeline(case_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = public_case(case_id, db, user)
    actions = db.scalars(select(CaseAction).where(CaseAction.case_id == item.id, CaseAction.visibility == Visibility.public).order_by(CaseAction.created_at)).all()
    return [TimelineItem(id=x.id, action_type=x.action_type, description=x.description, previous_status=x.previous_status, new_status=x.new_status, created_at=x.created_at) for x in actions]


@app.get("/api/v1/public/complaints/{reference}", response_model=CaseResponse)
def track(reference: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.scalar(select(Case).where(Case.reference == reference))
    if not item:
        raise error("NOT_FOUND", "Complaint not found", 404)
    return case_response(public_case(item.id, db, user))


def filtered_cases(db: Session, user: User, bureau: str | None, status: CaseStatus | None, category: str | None, priority: str | None, institution_id: UUID | None, ageing: str | None):
    query = select(Case)
    if user.role == Role.officer:
        query = query.where(Case.assigned_bureau == user.bureau_code)
    if bureau: query = query.where(Case.assigned_bureau == bureau)
    if status: query = query.where(Case.status == status)
    if category: query = query.where(Case.category == category)
    if priority: query = query.where(Case.priority == priority)
    if institution_id: query = query.where(Case.institution_id == institution_id)
    if ageing == "overdue": query = query.where(Case.due_at < utcnow(), Case.status != CaseStatus.disposed)
    return query.order_by(Case.received_at.desc())


@app.get("/api/v1/cases", response_model=CaseListResponse)
def list_cases(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), bureau: str | None = None, status: CaseStatus | None = None, category: str | None = None, priority: str | None = None, institution_id: UUID | None = None, ageing: str | None = None, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    query = filtered_cases(db, user, bureau, status, category, priority, institution_id, ageing)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()
    return CaseListResponse(items=[case_response(x) for x in items], total=total, page=page, page_size=page_size)


@app.get("/api/v1/cases/{case_id}", response_model=CaseResponse)
def read_case(case_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = get_case(db, case_id)
    if not can_view_case(user, item): raise error("FORBIDDEN", "You cannot access this case", 403)
    return case_response(item)


@app.patch("/api/v1/cases/{case_id}", response_model=CaseResponse)
def update_case(case_id: UUID, request: CasePatch, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    item = get_case(db, case_id)
    if user.role == Role.officer and item.assigned_bureau != user.bureau_code: raise error("FORBIDDEN", "Case belongs to another bureau", 403)
    before = {"status": item.status, "priority": item.priority}
    changes = request.model_dump(exclude_unset=True)
    previous_status = item.status
    for key, value in changes.items(): setattr(item, key, value)
    if request.status == CaseStatus.disposed: item.closed_at = utcnow(); item.public_status = "Disposed"
    item.updated_at = utcnow()
    db.add(CaseAction(case_id=item.id, actor_id=user.id, action_type="updated", description="Case details updated", previous_status=previous_status, new_status=item.status, visibility=Visibility.public if request.status else Visibility.internal))
    db.add(AuditEvent(actor_id=user.id, entity_type="case", entity_id=item.id, action="updated", before_json=before, after_json=changes))
    db.commit(); db.refresh(item)
    return case_response(item)


@app.post("/api/v1/cases/{case_id}/actions", response_model=TimelineItem, status_code=201)
def add_action(case_id: UUID, request: ActionCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    item = get_case(db, case_id); previous = item.status
    if request.new_status: item.status = request.new_status; item.public_status = request.new_status.replace("_", " ").title()
    action = CaseAction(case_id=item.id, actor_id=user.id, action_type=request.action_type, description=request.description, previous_status=previous, new_status=item.status, visibility=request.visibility)
    db.add(action); db.add(AuditEvent(actor_id=user.id, entity_type="case", entity_id=item.id, action="action_added", after_json={"action_type": request.action_type})); db.commit(); db.refresh(action)
    return TimelineItem(id=action.id, action_type=action.action_type, description=action.description, previous_status=action.previous_status, new_status=action.new_status, created_at=action.created_at)


@app.post("/api/v1/cases/{case_id}/assign")
def assign_case(case_id: UUID, request: AssignmentCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.supervisor, Role.admin))):
    item = get_case(db, case_id); assignee = db.get(User, request.assigned_to)
    if not assignee: raise error("NOT_FOUND", "Assignee not found", 404)
    item.assigned_officer_id = assignee.id; item.assigned_bureau = request.bureau_code
    db.add(CaseAssignment(case_id=item.id, assigned_to=assignee.id, assigned_by=user.id, bureau_code=request.bureau_code))
    db.add(AuditEvent(actor_id=user.id, entity_type="case", entity_id=item.id, action="assigned", after_json={"assigned_to": str(assignee.id), "bureau_code": request.bureau_code})); db.commit()
    return {"status": "assigned", "case_id": item.id, "assigned_to": assignee.id, "bureau_code": request.bureau_code}


@app.get("/api/v1/institutions", response_model=list[InstitutionResponse])
def institutions(q: str | None = None, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    query = select(Institution).order_by(Institution.name)
    if q: query = query.where(or_(Institution.name.ilike(f"%{q}%"), Institution.normalized_name.ilike(f"%{normalize_text(q)}%")))
    return db.scalars(query.limit(100)).all()


@app.get("/api/v1/institutions/{institution_id}", response_model=InstitutionResponse)
def institution(institution_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    item = db.get(Institution, institution_id)
    if not item: raise error("NOT_FOUND", "Institution not found", 404)
    return item


@app.get("/api/v1/institutions/{institution_id}/cases", response_model=CaseListResponse)
def institution_cases(institution_id: UUID, page: int = 1, page_size: int = 20, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    return list_cases(page, page_size, institution_id=institution_id, db=db, user=user)


def relationship_response(rel: CaseRelationship, db: Session) -> RelationshipResponse:
    a, b = get_case(db, rel.case_a_id), get_case(db, rel.case_b_id)
    return RelationshipResponse(id=rel.id, case_a=case_response(a), case_b=case_response(b), semantic_similarity=rel.semantic_similarity, relationship_score=rel.relationship_score, review_status=rel.review_status, explanation=rel.match_explanation, evidence_signals=(rel.evidence_json or {}).get("signals", []), model_version=rel.model_version, created_at=rel.created_at, reviewed_at=rel.reviewed_at)


@app.get("/api/v1/cases/{case_id}/related", response_model=list[RelationshipResponse])
def related(case_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    get_case(db, case_id)
    rels = db.scalars(select(CaseRelationship).where(or_(CaseRelationship.case_a_id == case_id, CaseRelationship.case_b_id == case_id)).order_by(CaseRelationship.created_at.desc())).all()
    return [relationship_response(x, db) for x in rels]


@app.post("/api/v1/coordination/relationships", response_model=RelationshipResponse, status_code=201)
def create_relationship(request: RelationshipCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    a, b = get_case(db, request.case_id), get_case(db, request.related_case_id)
    if a.id == b.id: raise error("INVALID_RELATIONSHIP", "A case cannot relate to itself")
    first, second = sorted([a.id, b.id], key=str)
    if db.scalar(select(CaseRelationship).where(CaseRelationship.case_a_id == first, CaseRelationship.case_b_id == second)): raise error("DUPLICATE_RELATIONSHIP", "This relationship already exists", 409)
    result = matching_service.compare(a.description, b.description, a.institution_id is not None and a.institution_id == b.institution_id)
    rel = CaseRelationship(case_a_id=first, case_b_id=second, semantic_similarity=result.semantic_similarity, relationship_score=result.relationship_score, match_explanation=request.match_explanation or result.explanation, evidence_json={"signals": request.evidence_signals or result.evidence_signals}, review_status=request.review_status, model_version=result.model_version)
    db.add(rel); db.commit(); db.refresh(rel)
    return relationship_response(rel, db)


@app.post("/api/v1/coordination/relationships/{relationship_id}/review", response_model=RelationshipResponse)
def review_relationship(relationship_id: UUID, request: RelationshipReview, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    rel = db.get(CaseRelationship, relationship_id)
    if not rel: raise error("NOT_FOUND", "Relationship not found", 404)
    rel.review_status = request.decision; rel.review_reason = request.reason; rel.reviewed_by = user.id; rel.reviewed_at = utcnow(); db.commit(); db.refresh(rel)
    return relationship_response(rel, db)


@app.get("/api/v1/coordination/alerts", response_model=list[RelationshipResponse])
def alerts(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    return [relationship_response(x, db) for x in db.scalars(select(CaseRelationship).where(CaseRelationship.review_status.in_([ReviewStatus.pending, ReviewStatus.needs_review])).order_by(CaseRelationship.created_at.desc())).all()]


@app.post("/api/v1/coordination/detect")
def detect(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    cases = db.scalars(select(Case).where(Case.status != CaseStatus.disposed).order_by(Case.received_at.desc()).limit(250)).all()
    created = 0
    for index, left in enumerate(cases):
        for right in cases[index + 1:]:
            same = left.institution_id is not None and left.institution_id == right.institution_id
            result = matching_service.compare(left.description, right.description, same)
            if result.relationship_score < 0.65: continue
            first, second = sorted([left.id, right.id], key=str)
            if db.scalar(select(CaseRelationship).where(CaseRelationship.case_a_id == first, CaseRelationship.case_b_id == second)): continue
            db.add(CaseRelationship(case_a_id=first, case_b_id=second, semantic_similarity=result.semantic_similarity, relationship_score=result.relationship_score, match_explanation=result.explanation, evidence_json={"signals": result.evidence_signals}, model_version=result.model_version)); created += 1
    db.commit()
    return {"created": created, "semantic_matching": "ready" if matching_service.ready else "fallback"}


@app.get("/api/v1/dashboard/summary")
def dashboard(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    query = filtered_cases(db, user, None, None, None, None, None, None)
    open_cases = db.scalar(select(func.count()).select_from(query.where(Case.status != CaseStatus.disposed).subquery())) or 0
    overdue = db.scalar(select(func.count()).select_from(query.where(Case.due_at < utcnow(), Case.status != CaseStatus.disposed).subquery())) or 0
    alerts_count = db.scalar(select(func.count(CaseRelationship.id)).where(CaseRelationship.review_status.in_([ReviewStatus.pending, ReviewStatus.needs_review]))) or 0
    awaiting = db.scalar(select(func.count()).select_from(query.where(Case.status == CaseStatus.awaiting_information).subquery())) or 0
    return {"total_cases": db.scalar(select(func.count()).select_from(query.subquery())) or 0, "open_cases": open_cases, "overdue_cases": overdue, "pending_overlap_alerts": alerts_count, "cases_awaiting_action": awaiting}


@app.get("/api/v1/analytics/cases")
def analytics_cases(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    rows = db.execute(select(Case.status, func.count(Case.id)).group_by(Case.status)).all()
    return {"by_status": {str(status): count for status, count in rows}}


@app.get("/api/v1/analytics/ageing")
def analytics_ageing(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    now = utcnow(); rows = db.scalars(select(Case).where(Case.status != CaseStatus.disposed)).all()
    return {"buckets": {"0_7": sum((now - x.received_at).days <= 7 for x in rows), "8_30": sum(8 <= (now - x.received_at).days <= 30 for x in rows), "31_plus": sum((now - x.received_at).days > 30 for x in rows)}}


@app.get("/api/v1/analytics/bureaus")
def analytics_bureaus(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    rows = db.execute(select(Case.assigned_bureau, func.count(Case.id)).group_by(Case.assigned_bureau)).all()
    return {"by_bureau": {bureau: count for bureau, count in rows}}


@app.get("/api/v1/analytics/disposition")
def analytics_disposition(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    rows = db.execute(select(Case.priority, func.count(Case.id)).where(Case.status == CaseStatus.disposed).group_by(Case.priority)).all()
    return {"disposed_by_priority": {priority: count for priority, count in rows}}


@app.get("/api/v1/notifications")
def notifications(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(100)).all()


@app.patch("/api/v1/notifications/{notification_id}")
def mark_notification(notification_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Notification, notification_id)
    if not item or item.user_id != user.id: raise error("NOT_FOUND", "Notification not found", 404)
    item.is_read = True; db.commit()
    return {"id": item.id, "is_read": True}


@app.get("/api/v1/reports/cases.csv")
def export_cases(bureau: str | None = None, status: CaseStatus | None = None, db: Session = Depends(get_db), user: User = Depends(require_roles(Role.officer, Role.supervisor, Role.admin))):
    items = db.scalars(filtered_cases(db, user, bureau, status, None, None, None, None)).all()
    output = io.StringIO(); writer = csv.writer(output); writer.writerow(["reference", "institution_name", "category", "status", "priority", "assigned_bureau", "received_at"])
    for item in items: writer.writerow([item.reference, item.submitted_institution_name, item.category, item.status, item.priority, item.assigned_bureau, item.received_at.isoformat()])
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=caselink-cases.csv"})


@app.post("/api/v1/public/complaints/{case_id}/attachments", status_code=201)
def upload_attachment(case_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = public_case(case_id, db, user)
    from .models import Attachment
    attachment = Attachment(case_id=item.id, uploaded_by=user.id, storage_path=f"demo/{item.reference}/{file.filename}", original_filename=file.filename or "upload", content_type=file.content_type or "application/octet-stream", size_bytes=len(file.file.read()), visibility=Visibility.public)
    db.add(attachment); db.commit(); db.refresh(attachment)
    return {"id": attachment.id, "storage_path": attachment.storage_path, "note": "Metadata-only demo upload; configure private Supabase Storage for production files."}
