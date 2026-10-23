# CASELINK AI Officer Coordination Portal

This is an unauthenticated demonstration dashboard. It calls the FastAPI service and never connects directly to Supabase.

```powershell
cd frontend\officer-portal
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the backend URL. There is no fake login and no browser-side database credential.

Production validation:

```powershell
npm run lint
npm run build
```
