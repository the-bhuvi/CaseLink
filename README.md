# CASELINK AI

**One Institution. Connected Cases. Coordinated Action.**

CASELINK AI is a FastAPI + Supabase PostgreSQL demonstration for institution-related complaint intake, public tracking, cross-bureau case coordination, and explainable relationship review. The public portal and officer dashboard both call the same backend API. The browser never receives the Supabase service-role key and does not access Supabase directly.

## Architecture

```text
Public portal ─┐
               ├── FastAPI ─── Supabase PostgreSQL + private Storage
Officer portal ┘       └────── Sentence Transformers matching service
```

Application login is intentionally disabled for this stage. The officer dashboard contains open demo controls and is not a production authorization boundary.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `database/supabase_schema.sql`.
3. Copy `.env.example` to `.env`.
4. Set `SUPABASE_URL` and the backend-only `SUPABASE_SERVICE_ROLE_KEY`. Keep this key out of both frontend `.env` files.
5. Optionally run `python -m database.seed` to create clearly marked synthetic records.

The private `caselink-private` Storage bucket is created by the schema script. The backend uploads attachment content; the browser receives metadata only.

## Run the backend

```powershell
python -m pip install -r requirements.txt
python -m backend.run
```

OpenAPI is available at `http://localhost:8000/docs`. Health endpoints are `/health` and `/ready`. If Supabase configuration is missing, `/ready` returns a structured `SUPABASE_NOT_CONFIGURED` error; the backend never switches to another database.

## Run the portals

```powershell
cd frontend\public-portal
npm install
Copy-Item .env.example .env
npm run dev
```

```powershell
cd frontend\officer-portal
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:8000` in each frontend environment file.

## AI matching

`POST /api/v1/cases/{case_id}/analyze` and `POST /api/v1/coordination/detect` compare candidate complaints using cached `all-MiniLM-L6-v2` embeddings, institution identity, category, and cross-bureau evidence. Results are stored in `case_relationships` and `coordination_alerts`. Similarity is not a probability, relationships never merge or close cases automatically, and human review remains required. If the model cannot load, analysis returns `AI_UNAVAILABLE`; no fake score is generated.

## Validation

```powershell
python -m pytest -q
python -m compileall -q backend database
cd frontend\public-portal; npm run lint; npm run build
cd ..\officer-portal; npm run lint; npm run build
```

The automated local tests cover Supabase-only readiness behavior and deterministic AI text normalization without pretending that a live Supabase project is configured.
