# CASELINK AI API contract

The browser applications call the FastAPI service through `VITE_API_BASE_URL`; only the backend talks to Supabase. No application login is enabled in this demonstration. Administrative controls are visibly unauthenticated demo controls and must be protected by a future identity layer before production use.

Base routes are `/health`, `/ready`, and `/api/v1`. Errors use `{ "detail": { "code", "message", "fields" } }`. Timestamps are ISO-8601 UTC strings; internal IDs are UUIDs and public references use `CL-YYYY-XXXXXX`.

Core endpoints:

- `POST /api/v1/public/complaints`, `GET /api/v1/public/complaints/{reference}`, and `GET /api/v1/public/complaints/{case_id}/timeline`
- `GET /api/v1/cases`, `GET /api/v1/cases/{case_id}`, `PATCH /api/v1/cases/{case_id}`, and `POST /api/v1/cases/{case_id}/actions`
- `GET /api/v1/institutions`, `GET /api/v1/institutions/{institution_id}`, and `GET /api/v1/institutions/{institution_id}/cases`
- `GET /api/v1/cases/{case_id}/matches`, `POST /api/v1/cases/{case_id}/analyze`, and `POST /api/v1/coordination/detect`
- `GET /api/v1/coordination/alerts`, `GET /api/v1/coordination/relationships`, and `POST /api/v1/coordination/relationships/{relationship_id}/review`
- `GET /api/v1/dashboard/summary`, `GET /api/v1/analytics/overview`, the smaller analytics routes, notifications, and `GET /api/v1/reports/cases.csv`

Case statuses are `received`, `under_review`, `in_progress`, `awaiting_information`, `escalated`, and `disposed`. Bureaus are `RB` and `PGRC`. Relationship review statuses are `pending`, `confirmed`, `rejected`, and `needs_review`.

Public tracking returns only public case fields and actions. Internal action history, relationship evidence, audit data, and private attachment contents are not returned by public routes.
