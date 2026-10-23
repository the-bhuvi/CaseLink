# CASELINK AI Public Portal

Unauthenticated public complaint intake and reference-based tracking.

```powershell
cd frontend\public-portal
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the FastAPI backend. The portal does not use mock responses, application login, Supabase browser access, or database credentials. A successful confirmation is shown only after the backend returns a persisted case reference.
