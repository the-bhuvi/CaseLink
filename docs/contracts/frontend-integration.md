# Frontend integration

Configure the frontend with the FastAPI base URL and never expose `DATABASE_URL`, the Supabase service-role key, or direct database writes. Login once, store the short-lived bearer token in the frontend's protected session, and send it on every API request. Use `GET /api/v1/auth/me` to hydrate the session.

Case cards consume the stable fields `id`, `reference`, `institution_id`, `institution_name`, `institution_permanent_id`, `category`, `subject`, `assigned_bureau`, `assigned_officer_id`, `status`, `priority`, `received_at`, `updated_at`, `due_at`, `closed_at`, `age_days`, and `public_status`. Dashboard keys are `total_cases`, `open_cases`, `overdue_cases`, `pending_overlap_alerts`, and `cases_awaiting_action`. Relationship alerts contain case A/B summaries, semantic similarity, relationship score, review status, explanation, evidence signals, model version, and timestamps.

Supabase uses a server-side PostgreSQL pooled connection for hosted deployments. If attachments are moved from the included metadata-only demo flow to storage, create a private bucket and authorize all upload/download operations through FastAPI.
