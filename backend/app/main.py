import csv
import io
import secrets
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from supabase import Client

from .config import settings
from .database import get_supabase
from .schemas import CaseActionCreate, CaseListResponse, CaseResponse, ComplaintCreate, InstitutionVerificationRequest, RelationshipReview
from .services.matching import AIUnavailable, matching_service, normalize_text
from .reference_data import GRIEVANCE_TAXONOMY

app = FastAPI(
    title="CASELINK AI API",
    version="2.0.0",
    description="Supabase-backed explainable cross-bureau complaint monitoring API.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

CASE_STATUSES = {"received", "under_review", "in_progress", "awaiting_information", "escalated", "disposed"}
REVIEW_STATUSES = {"pending", "confirmed", "rejected", "needs_review"}


def api_error(code: str, message: str, status: int = 400, fields: dict | None = None) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message, "fields": fields or {}})


def rows(client: Client, table: str, selection: str = "*", **filters: Any) -> list[dict]:
    try:
        query = client.table(table).select(selection)
        for key, value in filters.items():
            query = query.eq(key, value)
        return query.execute().data or []
    except Exception as exc:
        raise api_error("SUPABASE_QUERY_FAILED", f"Supabase query failed for {table}: {exc}", 503)


def first_row(client: Client, table: str, selection: str = "*", **filters: Any) -> dict | None:
    result = rows(client, table, selection, **filters)
    return result[0] if result else None


def write(client: Client, table: str, payload: dict, *, returning: str = "*") -> dict:
    try:
        result = client.table(table).insert(payload).execute()
        data = result.data or []
        return data[0] if data else payload
    except Exception as exc:
        raise api_error("SUPABASE_WRITE_FAILED", f"Supabase write failed for {table}: {exc}", 503)


def update(client: Client, table: str, payload: dict, **filters: Any) -> dict:
    try:
        query = client.table(table).update(payload)
        for key, value in filters.items():
            query = query.eq(key, value)
        result = query.execute()
        data = result.data or []
        return data[0] if data else {}
    except Exception as exc:
        raise api_error("SUPABASE_WRITE_FAILED", f"Supabase update failed for {table}: {exc}", 503)


def case_response(item: dict) -> CaseResponse:
    institution = item.get("institutions") or {}
    received = item.get("received_at") or datetime.now(timezone.utc).isoformat()
    parsed = datetime.fromisoformat(received.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    age_days = max(0, (datetime.now(timezone.utc) - parsed).days)
    return CaseResponse(
        id=item["id"],
        reference=item["reference"],
        institution_id=item.get("institution_id"),
        institution_name=institution.get("name") or item.get("submitted_institution_name", "Unknown institution"),
        institution_permanent_id=item.get("submitted_institution_id") or institution.get("aicte_permanent_id"),
        category=item["category"],
        subcategory=item.get("subcategory"),
        specific_issue=item.get("specific_issue"),
        state=item.get("state") or institution.get("state"),
        district=item.get("district") or institution.get("district"),
        subject=item["subject"],
        description=item.get("description"),
        assigned_bureau=item.get("assigned_bureau", "RB"),
        assigned_officer_id=item.get("assigned_officer_id"),
        status=item["status"],
        priority=item.get("priority", "medium"),
        received_at=parsed,
        updated_at=item.get("updated_at") or received,
        due_at=item.get("due_at"),
        closed_at=item.get("closed_at"),
        age_days=age_days,
        public_status=item.get("public_status") or item["status"].replace("_", " ").title(),
        next_action=item.get("next_action"),
    )


def case_select() -> str:
    return "*,institutions(id,name,aicte_permanent_id,state,district,institution_type)"


def get_case(client: Client, case_id: str) -> dict:
    item = first_row(client, "cases", case_select(), id=case_id)
    if not item:
        raise api_error("NOT_FOUND", "Case not found", 404)
    return item


def get_case_by_reference(client: Client, reference: str) -> dict:
    item = first_row(client, "cases", case_select(), reference=reference)
    if not item:
        raise api_error("NOT_FOUND", "Complaint reference not found", 404)
    return item


def public_case_response(item: dict) -> CaseResponse:
    response = case_response(item)
    response.description = None
    response.next_action = None
    return response


def next_reference(client: Client) -> str:
    for _ in range(5):
        candidate = f"CL-{datetime.now(timezone.utc).year}-{secrets.token_hex(3).upper()}"
        if not first_row(client, "cases", "id", reference=candidate):
            return candidate
    raise api_error("REFERENCE_GENERATION_FAILED", "Could not generate a unique public reference", 503)


def refresh_relationship(client: Client, relationship_id: str) -> dict:
    relation = first_row(client, "case_relationships", "*", id=relationship_id)
    if not relation:
        raise api_error("NOT_FOUND", "Relationship not found", 404)
    case_a = get_case(client, relation["case_a_id"])
    case_b = get_case(client, relation["case_b_id"])
    evidence = relation.get("evidence_json") or {}
    return {
        "id": relation["id"],
        "case_a": case_response(case_a),
        "case_b": case_response(case_b),
        "semantic_similarity": relation.get("semantic_similarity"),
        "relationship_score": relation.get("relationship_score"),
        "review_status": relation.get("review_status"),
        "explanation": relation.get("match_explanation"),
        "evidence_signals": evidence.get("signals", []),
        "uncertainty": evidence.get("uncertainty", []),
        "recommended_next_action": evidence.get("recommended_next_action", "Review both cases with the responsible bureaus."),
        "model_version": relation.get("model_version"),
        "created_at": relation.get("created_at"),
        "reviewed_by": relation.get("reviewed_by"),
        "review_reason": relation.get("review_reason"),
        "reviewed_at": relation.get("reviewed_at"),
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "caselink-api", "database": "supabase-only"}


@app.get("/ready")
@app.get("/api/v1/health/ready")
def ready(client: Client = Depends(get_supabase)) -> dict:
    try:
        client.table("cases").select("id").limit(1).execute()
    except Exception as exc:
        raise api_error("SUPABASE_NOT_READY", f"Supabase is not ready: {exc}", 503)
    return {
        "status": "ready",
        "database": "supabase",
        "semantic_matching": "ready" if matching_service.ready else ("unavailable" if matching_service.load_error else "not_loaded"),
    }


@app.post("/api/v1/public/complaints", response_model=CaseResponse, status_code=201)
def create_complaint(payload: ComplaintCreate, client: Client = Depends(get_supabase)):
    category = next((item for item in GRIEVANCE_TAXONOMY if item["label"] == payload.category), None)
    subcategory = next((item for item in (category or {}).get("subcategories", []) if item["label"] == payload.subcategory), None)
    if (payload.subcategory or payload.specific_issue) and (not category or not subcategory or payload.specific_issue not in subcategory["issues"]):
        raise api_error("INVALID_GRIEVANCE_SELECTION", "Category, subcategory, and specific issue must be a valid combination.", 422)
    institution = None
    if payload.institution_id:
        institution = first_row(client, "institutions", "*", id=str(payload.institution_id))
    if not institution and payload.institution_permanent_id:
        institution = first_row(client, "institutions", "*", aicte_permanent_id=payload.institution_permanent_id)
    if not institution:
        raise api_error("INSTITUTION_VERIFICATION_REQUIRED", "Select a verified institution from the institution directory.", 422)
    known_state = institution.get("state") not in {None, "", "Unknown"}
    known_district = institution.get("district") not in {None, "", "Unknown"}
    if payload.state and known_state and payload.state != institution.get("state"):
        raise api_error("INSTITUTION_LOCATION_MISMATCH", "The selected state does not match the institution record.", 422)
    if payload.district and known_district and payload.district != institution.get("district"):
        raise api_error("INSTITUTION_LOCATION_MISMATCH", "The selected district does not match the institution record.", 422)
    item = write(client, "cases", {
        "reference": next_reference(client),
        "institution_id": institution["id"],
        "submitted_institution_name": institution["name"],
        "submitted_institution_id": institution.get("aicte_permanent_id"),
        "category": payload.category,
        "subcategory": payload.subcategory,
        "specific_issue": payload.specific_issue,
        "state": institution.get("state") if known_state else payload.state,
        "district": institution.get("district") if known_district else payload.district,
        "subject": payload.subject,
        "description": payload.description,
        "source_channel": payload.source_channel,
        "assigned_bureau": "RB",
        "status": "received",
        "priority": "medium",
        "next_action": "Review complaint",
        "public_status": "Received",
        "complainant_name": payload.complainant_name,
        "complainant_email": payload.complainant_email,
    })
    write(client, "case_actions", {
        "case_id": item["id"],
        "action_type": "submitted",
        "description": "Complaint submitted through the public portal.",
        "new_status": "received",
        "visibility": "public",
    })
    return case_response(get_case(client, item["id"]))


@app.post("/api/v1/public/institution-verification-requests", status_code=202)
def create_institution_verification_request(payload: InstitutionVerificationRequest, client: Client = Depends(get_supabase)):
    item = write(client, "institution_verification_requests", {
        "submitted_name": payload.submitted_name,
        "state": payload.state,
        "district": payload.district,
        "details": payload.details,
        "contact_email": payload.contact_email,
        "status": "pending",
    })
    return {"id": item.get("id"), "status": "pending", "message": "Your institution details were submitted for verification review."}


@app.get("/api/v1/public/complaints/{reference}", response_model=CaseResponse)
def track_complaint(reference: str, client: Client = Depends(get_supabase)):
    return public_case_response(get_case_by_reference(client, reference))


@app.get("/api/v1/public/complaints/{case_id}/timeline")
def public_timeline(case_id: str, client: Client = Depends(get_supabase)):
    get_case(client, case_id)
    timeline = rows(client, "case_actions", "*", case_id=case_id)
    return [
        {
            "id": event["id"],
            "action_type": event["action_type"],
            "description": event["description"],
            "previous_status": event.get("previous_status"),
            "new_status": event.get("new_status"),
            "created_at": event["created_at"],
        }
        for event in sorted(timeline, key=lambda value: value.get("created_at", ""))
        if event.get("visibility") == "public"
    ]


def list_case_rows(client: Client, page: int, page_size: int, filters: dict[str, str | None]) -> CaseListResponse:
    try:
        query = client.table("cases").select(case_select(), count="exact")
        for key, value in filters.items():
            if value and key == "search":
                query = query.or_(f"reference.ilike.%{value}%,submitted_institution_name.ilike.%{value}%,submitted_institution_id.ilike.%{value}%,state.ilike.%{value}%,district.ilike.%{value}%")
            elif value and key == "ageing" and value == "overdue":
                query = query.lt("due_at", datetime.now(timezone.utc).isoformat()).neq("status", "disposed")
            elif value:
                query = query.eq(key, value)
        result = query.order("received_at", desc=True).range((page - 1) * page_size, page * page_size - 1).execute()
        data = result.data or []
        total = result.count or 0
        return CaseListResponse(items=[case_response(item) for item in data], total=total, page=page, page_size=page_size)
    except Exception as exc:
        raise api_error("SUPABASE_QUERY_FAILED", f"Could not list cases: {exc}", 503)


@app.get("/api/v1/cases", response_model=CaseListResponse)
def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    bureau: str | None = None,
    status: str | None = None,
    category: str | None = None,
    subcategory: str | None = None,
    specific_issue: str | None = None,
    state: str | None = None,
    district: str | None = None,
    priority: str | None = None,
    institution_id: str | None = None,
    ageing: str | None = None,
    client: Client = Depends(get_supabase),
):
    if status and status not in CASE_STATUSES:
        raise api_error("INVALID_STATUS", "Unsupported case status")
    return list_case_rows(client, page, page_size, {"search": search, "assigned_bureau": bureau, "status": status, "category": category, "subcategory": subcategory, "specific_issue": specific_issue, "state": state, "district": district, "priority": priority, "institution_id": institution_id, "ageing": ageing})


@app.get("/api/v1/cases/{case_id}", response_model=CaseResponse)
def read_case(case_id: str, client: Client = Depends(get_supabase)):
    return case_response(get_case(client, case_id))


@app.patch("/api/v1/cases/{case_id}", response_model=CaseResponse)
def update_case(case_id: str, payload: dict, client: Client = Depends(get_supabase)):
    item = get_case(client, case_id)
    allowed = {"status", "priority", "next_action", "due_at", "assigned_bureau"}
    changes = {key: value for key, value in payload.items() if key in allowed and value is not None}
    if "status" in changes and changes["status"] not in CASE_STATUSES:
        raise api_error("INVALID_STATUS", "Unsupported case status")
    if not changes:
        raise api_error("NO_CHANGES", "No supported case fields were supplied")
    if changes.get("status") == "disposed":
        changes["closed_at"] = datetime.now(timezone.utc).isoformat()
        changes["public_status"] = "Disposed"
    updated = update(client, "cases", changes, id=case_id)
    write(client, "case_actions", {
        "case_id": case_id,
        "action_type": "case_updated",
        "description": "Case fields updated through the operations dashboard.",
        "previous_status": item.get("status"),
        "new_status": changes.get("status"),
        "visibility": "public" if "status" in changes else "internal",
    })
    return case_response(updated or get_case(client, case_id))


@app.post("/api/v1/cases/{case_id}/actions")
def create_action(case_id: str, payload: CaseActionCreate, client: Client = Depends(get_supabase)):
    item = get_case(client, case_id)
    if payload.visibility not in {"public", "internal"}:
        raise api_error("INVALID_VISIBILITY", "Visibility must be public or internal")
    if payload.new_status and payload.new_status not in CASE_STATUSES:
        raise api_error("INVALID_STATUS", "Unsupported case status")
    if payload.new_status or payload.next_action or payload.due_at:
        changes = {}
        if payload.new_status:
            changes["status"] = payload.new_status
            changes["public_status"] = payload.new_status.replace("_", " ").title()
        if payload.next_action:
            changes["next_action"] = payload.next_action
        if payload.due_at:
            changes["due_at"] = payload.due_at.isoformat()
        update(client, "cases", changes, id=case_id)
    return write(client, "case_actions", {
        "case_id": case_id,
        "action_type": payload.action_type,
        "description": payload.description,
        "previous_status": item.get("status"),
        "new_status": payload.new_status,
        "visibility": payload.visibility,
    })


@app.get("/api/v1/institutions")
def institutions(q: str | None = None, state: str | None = None, district: str | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), client: Client = Depends(get_supabase)):
    try:
        query = client.table("institutions").select("*").order("name")
        if q:
            term = q.strip().replace("%", "").replace(",", " ")
            normalized_term = normalize_text(term)
            query = query.or_(f"name.ilike.%{term}%,normalized_name.ilike.%{normalized_term}%,aicte_permanent_id.ilike.%{term}%")
        if state:
            query = query.eq("state", state)
        if district:
            query = query.eq("district", district)
        return query.range((page - 1) * page_size, page * page_size - 1).execute().data or []
    except Exception as exc:
        raise api_error("SUPABASE_QUERY_FAILED", f"Could not list institutions: {exc}", 503)


@app.get("/api/v1/reference/states")
def reference_states(client: Client = Depends(get_supabase)):
        try:
            return client.table("administrative_states").select("id,name,kind,source_url,source_updated_at").order("name").execute().data or []
        except Exception as exc:
            raise api_error("SUPABASE_QUERY_FAILED", f"Could not list states: {exc}", 503)


@app.get("/api/v1/reference/states/{state_id}/districts")
def reference_districts(state_id: str, q: str | None = None, client: Client = Depends(get_supabase)):
        try:
            query = client.table("administrative_districts").select("id,state_id,name,source_url,source_updated_at").eq("state_id", state_id).order("name")
            if q:
                query = query.ilike("name", f"%{q}%")
            return query.limit(250).execute().data or []
        except Exception as exc:
            raise api_error("SUPABASE_QUERY_FAILED", f"Could not list districts: {exc}", 503)


@app.get("/api/v1/reference/grievance-taxonomy")
def grievance_taxonomy() -> list[dict]:
    return GRIEVANCE_TAXONOMY


@app.get("/api/v1/institutions/{institution_id}")
def institution(institution_id: str, client: Client = Depends(get_supabase)):
    item = first_row(client, "institutions", "*", id=institution_id)
    if not item:
        raise api_error("NOT_FOUND", "Institution not found", 404)
    return item


@app.get("/api/v1/institutions/{institution_id}/cases", response_model=CaseListResponse)
def institution_cases(institution_id: str, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), client: Client = Depends(get_supabase)):
    return list_case_rows(client, page, page_size, {"institution_id": institution_id})


def relationship_candidates(client: Client, case_id: str) -> list[dict]:
    source = get_case(client, case_id)
    try:
        query = client.table("cases").select(case_select()).neq("id", case_id).limit(250)
        if source.get("institution_id"):
            query = query.eq("institution_id", source["institution_id"])
        candidates = query.execute().data or []
    except Exception as exc:
        raise api_error("SUPABASE_QUERY_FAILED", f"Could not retrieve matching candidates: {exc}", 503)
    return [candidate for candidate in candidates if candidate.get("status") != "disposed"]


@app.get("/api/v1/cases/{case_id}/matches")
@app.get("/api/v1/cases/{case_id}/related")
def matches(case_id: str, client: Client = Depends(get_supabase)):
    get_case(client, case_id)
    relationships = rows(client, "case_relationships", "*", case_a_id=case_id) + rows(client, "case_relationships", "*", case_b_id=case_id)
    result = []
    for relationship in relationships:
        result.append(refresh_relationship(client, relationship["id"]))
    return result


@app.post("/api/v1/cases/{case_id}/analyze")
@app.post("/api/v1/coordination/detect")
def analyze_case(case_id: str | None = None, client: Client = Depends(get_supabase)):
    deterministic_alerts = create_coordination_gap_alerts(client, case_id)
    if not case_id:
        candidates = rows(client, "cases", case_select())
        created = 0
        for item in candidates[:100]:
            try:
                created += analyze_case_records(client, item, relationship_candidates(client, item["id"]))
            except AIUnavailable:
                raise api_error("AI_UNAVAILABLE", "Semantic matching is unavailable; normal case operations remain available.", 503)
        return {"created": created, "deterministic_alerts": deterministic_alerts, "semantic_matching": "ready"}
    source = get_case(client, case_id)
    try:
        created = analyze_case_records(client, source, relationship_candidates(client, case_id))
    except AIUnavailable:
        raise api_error("AI_UNAVAILABLE", "Semantic matching is unavailable; normal case operations remain available.", 503)
    return {"case_id": case_id, "created": created, "deterministic_alerts": deterministic_alerts, "semantic_matching": "ready"}


def create_coordination_gap_alerts(client: Client, case_id: str | None) -> int:
    now = datetime.now(timezone.utc)
    cases = [get_case(client, case_id)] if case_id else rows(client, "cases", "id,reference,status,due_at,assigned_bureau")
    relationships = rows(client, "case_relationships", "id,case_a_id,case_b_id,review_status")
    if case_id:
        relationships = [
            relationship
            for relationship in relationships
            if case_id in {relationship.get("case_a_id"), relationship.get("case_b_id")}
        ]
    created = 0
    for item in cases:
        due_at = item.get("due_at")
        if item.get("status") != "disposed" and due_at and datetime.fromisoformat(due_at.replace("Z", "+00:00")) < now:
            existing = rows(client, "coordination_alerts", "id", case_id=item["id"], status="open")
            if not existing:
                write(client, "coordination_alerts", {
                    "case_id": item["id"],
                    "title": "Overdue next action",
                    "reason": f"Case {item.get('reference', item['id'])} has passed its next-action date.",
                    "severity": "high",
                    "recommended_action": "Record the overdue follow-up or update the next-action date.",
                })
                created += 1
    for relation in relationships:
        if relation.get("review_status") in {"pending", "needs_review"} and not rows(client, "coordination_alerts", "id", relationship_id=relation["id"], status="open"):
            write(client, "coordination_alerts", {
                "relationship_id": relation["id"],
                "title": "Unreviewed relationship",
                "reason": "A potential relationship remains unreviewed.",
                "severity": "medium",
                "recommended_action": "Review the relationship evidence and record a decision.",
            })
            created += 1
    return created


def analyze_case_records(client: Client, source: dict, candidates: list[dict]) -> int:
    created = 0
    for candidate in candidates:
        first, second = sorted([source["id"], candidate["id"]])
        if first == second or first_row(client, "case_relationships", "id", case_a_id=first, case_b_id=second):
            continue
        result = matching_service.compare(
            f"{source.get('subject', '')}. {source.get('description', '')}",
            f"{candidate.get('subject', '')}. {candidate.get('description', '')}",
            same_institution=bool(source.get("institution_id") and source.get("institution_id") == candidate.get("institution_id")),
            same_category=source.get("category") == candidate.get("category"),
            cross_bureau=source.get("assigned_bureau") != candidate.get("assigned_bureau"),
            same_subcategory=bool(source.get("subcategory") and source.get("subcategory") == candidate.get("subcategory")),
            same_specific_issue=bool(source.get("specific_issue") and source.get("specific_issue") == candidate.get("specific_issue")),
        )
        if result.relationship_score < 0.65:
            continue
        relationship = write(client, "case_relationships", {
            "case_a_id": first,
            "case_b_id": second,
            "semantic_similarity": result.semantic_similarity,
            "relationship_score": result.relationship_score,
            "match_explanation": result.explanation,
            "evidence_json": {
                "signals": result.evidence_signals,
                "uncertainty": result.uncertainty,
                "recommended_next_action": "Compare the two case histories and record a human review decision.",
            },
            "review_status": "pending",
            "model_version": result.model_version,
        })
        write(client, "coordination_alerts", {
            "relationship_id": relationship["id"],
            "severity": "high" if result.relationship_score >= 0.8 else "medium",
            "title": "Potential cross-bureau relationship requires review",
            "reason": result.explanation,
            "recommended_action": "Review the relationship before coordinating next steps.",
            "status": "open",
            "due_at": datetime.now(timezone.utc).isoformat(),
        })
        created += 1
    return created


@app.get("/api/v1/coordination/relationships")
@app.get("/api/v1/coordination/alerts")
def coordination_alerts(client: Client = Depends(get_supabase)):
    relationships = rows(client, "case_relationships", "*")
    return [refresh_relationship(client, relation["id"]) for relation in relationships]


@app.post("/api/v1/coordination/relationships/{relationship_id}/review")
def review_relationship(relationship_id: str, payload: RelationshipReview, client: Client = Depends(get_supabase)):
    if payload.decision not in REVIEW_STATUSES:
        raise api_error("INVALID_REVIEW_STATUS", "Decision must be pending, confirmed, rejected, or needs_review")
    update(client, "case_relationships", {
        "review_status": payload.decision,
        "review_reason": payload.reason,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }, id=relationship_id)
    alerts = rows(client, "coordination_alerts", "*", relationship_id=relationship_id)
    for alert in alerts:
        update(client, "coordination_alerts", {"status": "resolved" if payload.decision in {"confirmed", "rejected"} else "open"}, id=alert["id"])
    return refresh_relationship(client, relationship_id)


@app.get("/api/v1/dashboard/summary")
def dashboard_summary(client: Client = Depends(get_supabase)):
    cases = rows(client, "cases", "id,status,due_at")
    now = datetime.now(timezone.utc)
    open_cases = [item for item in cases if item.get("status") != "disposed"]
    overdue = [item for item in open_cases if item.get("due_at") and datetime.fromisoformat(item["due_at"].replace("Z", "+00:00")) < now]
    relationships = rows(client, "case_relationships", "review_status")
    return {
        "total_cases": len(cases),
        "open_cases": len(open_cases),
        "overdue_cases": len(overdue),
        "disposed_cases": len(cases) - len(open_cases),
        "pending_overlap_alerts": sum(item.get("review_status") in {"pending", "needs_review"} for item in relationships),
        "suggested_relationships": len(relationships),
        "confirmed_relationships": sum(item.get("review_status") == "confirmed" for item in relationships),
        "cases_awaiting_action": sum(item.get("status") == "awaiting_information" for item in cases),
    }


@app.get("/api/v1/analytics/overview")
def analytics_overview(client: Client = Depends(get_supabase)):
    cases = rows(client, "cases", "status,assigned_bureau,received_at,priority")
    return {
        "by_status": count_by(cases, "status"),
        "by_bureau": count_by(cases, "assigned_bureau"),
        "by_priority": count_by(cases, "priority"),
        "ageing": {
            "0_7": sum(age(item.get("received_at")) <= 7 for item in cases),
            "8_30": sum(8 < age(item.get("received_at")) <= 30 for item in cases),
            "31_plus": sum(age(item.get("received_at")) > 30 for item in cases),
        },
    }


def count_by(items: list[dict], key: str) -> dict[str, int]:
    result: dict[str, int] = {}
    for item in items:
        value = item.get(key) or "unknown"
        result[value] = result.get(value, 0) + 1
    return result


def age(value: str | None) -> int:
    if not value:
        return 0
    return max(0, (datetime.now(timezone.utc) - datetime.fromisoformat(value.replace("Z", "+00:00"))).days)


@app.get("/api/v1/analytics/cases")
def analytics_cases(client: Client = Depends(get_supabase)):
    return {"by_status": count_by(rows(client, "cases", "status"), "status")}


@app.get("/api/v1/analytics/ageing")
def analytics_ageing(client: Client = Depends(get_supabase)):
    values = rows(client, "cases", "received_at,status")
    open_values = [item for item in values if item.get("status") != "disposed"]
    return {"buckets": {"0_7": sum(age(x.get("received_at")) <= 7 for x in open_values), "8_30": sum(8 < age(x.get("received_at")) <= 30 for x in open_values), "31_plus": sum(age(x.get("received_at")) > 30 for x in open_values)}}


@app.get("/api/v1/analytics/bureaus")
def analytics_bureaus(client: Client = Depends(get_supabase)):
    return {"by_bureau": count_by(rows(client, "cases", "assigned_bureau"), "assigned_bureau")}


@app.get("/api/v1/analytics/disposition")
def analytics_disposition(client: Client = Depends(get_supabase)):
    return {"disposed_by_priority": count_by([x for x in rows(client, "cases", "priority,status") if x.get("status") == "disposed"], "priority")}


@app.get("/api/v1/notifications")
def notifications(client: Client = Depends(get_supabase)):
    return rows(client, "notifications", "*")


@app.patch("/api/v1/notifications/{notification_id}")
def mark_notification(notification_id: str, client: Client = Depends(get_supabase)):
    return update(client, "notifications", {"is_read": True}, id=notification_id)


@app.get("/api/v1/reports/cases.csv")
def export_cases(client: Client = Depends(get_supabase)):
    cases = rows(client, "cases", case_select())
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["reference", "institution_name", "category", "status", "priority", "assigned_bureau", "received_at"])
    for item in cases:
        writer.writerow([item.get("reference"), (item.get("institutions") or {}).get("name") or item.get("submitted_institution_name"), item.get("category"), item.get("status"), item.get("priority"), item.get("assigned_bureau"), item.get("received_at")])
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=caselink-cases.csv"})


@app.post("/api/v1/public/complaints/{case_id}/attachments", status_code=201)
def upload_attachment(case_id: str, file: UploadFile = File(...), client: Client = Depends(get_supabase)):
    get_case(client, case_id)
    content = file.file.read()
    path = f"demo/{case_id}/{secrets.token_hex(8)}-{file.filename or 'upload'}"
    try:
        client.storage.from_(settings.storage_bucket).upload(path, content, {"content-type": file.content_type or "application/octet-stream", "upsert": "false"})
    except Exception as exc:
        raise api_error("STORAGE_UPLOAD_FAILED", f"Private Supabase Storage upload failed: {exc}", 503)
    metadata = write(client, "attachments", {"case_id": case_id, "storage_path": path, "original_filename": file.filename or "upload", "content_type": file.content_type or "application/octet-stream", "size_bytes": len(content), "visibility": "internal"})
    return {"id": metadata["id"], "storage_path": path, "note": "Stored in the configured private Supabase Storage bucket."}
