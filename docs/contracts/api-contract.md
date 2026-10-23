# CASELINK AI API contract

Base URL is the FastAPI service; all application routes use `/api/v1`. OpenAPI is available at `/docs`; health checks are `/health` and `/api/v1/health/ready`. JSON uses ISO-8601 UTC timestamps and UUID strings. List endpoints use `{items,total,page,page_size}` and default to page 1, 20 items (maximum 100).

Authentication is `POST /api/v1/auth/demo-login` followed by `Authorization: Bearer <access_token>`. Demo identities are `complainant@demo.caselink`, `rb.officer@demo.caselink`, `pgrc.officer@demo.caselink`, `supervisor@demo.caselink`, and `admin@demo.caselink`. This is a short-lived demo token, not production identity verification.

Canonical case statuses are `received`, `under_review`, `in_progress`, `awaiting_information`, `escalated`, `disposed`; roles are `complainant`, `officer`, `supervisor`, `admin`; overlap review statuses are `pending`, `confirmed`, `rejected`, `needs_review`. Standard errors are `{detail:{code,message,fields}}`.

The public routes create, track, list owned complaints, expose public timelines, and accept metadata-only demo attachments. Officer routes list/update/assign cases, manage institutions, actions, coordination relationships, dashboard metrics, analytics, notifications, and CSV reports. A complainant never receives internal actions, assignments, private attachments, or AI deliberation.

