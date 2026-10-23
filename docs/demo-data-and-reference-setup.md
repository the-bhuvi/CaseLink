# Demo data and reference setup

Run these scripts in the Supabase SQL Editor, in order:

1. `database/supabase_schema.sql` for a new database, or `database/enhancements_migration.sql` for an existing database.
2. `database/reference_data.sql` to load all 28 states and 8 Union Territories.
3. Import the current state/UT district export from the IGOD directory into `administrative_districts`, preserving the IDs in `administrative_states`. The repository intentionally includes only a clearly marked Pune example rather than claiming a complete district catalogue without a verified import file.
4. `database/demo_cases.sql` to load repeatable synthetic institutions and cases.

The seed uses stable `DEMO-AICTE-*` institution identifiers and `CL-DEMO-*` case references. It updates only those synthetic rows and never truncates or deletes user data. After loading it, call `POST /api/v1/coordination/detect` (or analyze a case with `POST /api/v1/cases/{case_id}/analyze`) to run the configured semantic model. SQL does not fabricate AI relationships.

The public portal uses `GET /api/v1/institutions`, `GET /api/v1/reference/states`, `GET /api/v1/reference/states/{state_id}/districts`, and `GET /api/v1/reference/grievance-taxonomy`. Institution records must be verified/imported into `institutions`; unverified text is not accepted as an official institution.

If an institution is missing, the portal can create a pending `institution_verification_requests` record for administrator review. Reviewing that request and importing a verified institution record remain separate administrative steps.

For the supplied shortlisted PDF, run:

```powershell
python database\import_institutions.py "D:\DOWNLOADS\Shortlisted institutes for Website.pdf" --csv database\imported_institutions.csv
python database\import_institutions.py "D:\DOWNLOADS\Shortlisted institutes for Website.pdf" --import
```

The PDF contains 4,788 text-extractable rows across 141 pages. Its columns are application number, permanent ID, and institution name; it does not provide state or district. The importer preserves both IDs and the official name, normalizes only the search field, upserts by the PDF application number, and stores `Unknown` location values until a verified location enrichment is loaded. Two rows have no permanent ID in the source and are flagged for review rather than assigned an invented identifier.
