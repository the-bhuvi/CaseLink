# Frontend integration

Both portals use `VITE_API_BASE_URL` and call FastAPI. Neither portal contains Supabase credentials or performs direct browser database writes. Copy each frontend `.env.example` to `.env` and set only the API URL.

The public portal submits `institution_name`, optional permanent ID, `category`, `subject`, `description`, and contact fields to `POST /api/v1/public/complaints`. The returned `reference` is used by the confirmation and tracking pages.

The officer portal is an unauthenticated demonstration view. It uses live dashboard, case, institution, relationship, analytics, notification, action, review, and CSV endpoints. This is not a security boundary; add backend identity and authorization before exposing sensitive records outside a controlled demo.

AI readiness is reported by `/ready`. `ready` means the model has loaded, `not_loaded` means it has not yet been initialized, and `unavailable` means model loading failed. Normal case browsing and submission continue when AI is unavailable; analysis endpoints return `AI_UNAVAILABLE` rather than fabricated scores.
