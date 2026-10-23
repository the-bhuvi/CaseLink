# CASELINK AI Supabase data model

`database/supabase_schema.sql` is the repeatable Supabase SQL Editor script. It creates `institutions`, `cases`, `case_actions`, `case_relationships`, `coordination_alerts`, `attachments`, `notifications`, and `audit_events`, with foreign keys, indexes, timestamp triggers, status checks, and canonical ordered relationship pairs.

Cases retain original submitted institution text and identifiers while using `institution_id` for normalized identity. Relationships retain separate semantic similarity and relationship score fields, evidence JSON, uncertainty, model version, review decision, reason, reviewer, and review timestamp. Synthetic seed rows are marked `is_synthetic = true`.

The private `caselink-private` Supabase Storage bucket is created by the SQL script. File metadata is stored in `attachments`; the backend performs uploads with the server-only service-role key and does not expose public file URLs.
