# CASELINK AI data model

The normalized PostgreSQL model contains `users`, `institutions`, `cases`, `case_actions`, `case_assignments`, `case_relationships`, `attachments`, `notifications`, and `audit_events`. Every primary key is a UUID. Case references are human-readable (`CL-YYYY-NNNNN`). Timestamps are UTC. `case_relationships` stores ordered UUID pairs with a unique constraint, separate `semantic_similarity` and `relationship_score`, evidence JSON, model version, reviewer, reason, and review timestamp.

`RB` and `PGRC` are canonical demo bureaus. Seed data is explicitly synthetic. PostgreSQL migrations are managed by Alembic; `database/schema.sql` documents the extension and migration entrypoint.

