# CASELINK AI Officer Coordination Portal

## Run

```powershell
cd frontend\officer-portal
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the FastAPI service (default `http://localhost:8000`). The backend must be running and seeded for populated dashboards:

```powershell
python -m alembic upgrade head
python -m database.seed
python -m backend.run
```

Demo identities are `rb.officer@demo.caselink`, `pgrc.officer@demo.caselink`, `supervisor@demo.caselink`, and `admin@demo.caselink`. The app uses the backend API only; it does not connect to Supabase directly.

## Validate

```powershell
npm run lint
npm run build
```

The current backend contract exposes compact analytics endpoints. The portal displays those live values and shows empty states for metrics that are not supplied by the API. Case descriptions and audit records remain backend-controlled; attachment access is not invented because the backend currently provides metadata-only demo uploads.
