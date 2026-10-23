-- Apply once to an existing CASELINK AI database.
-- Safe for existing data; all new case fields are nullable for backward compatibility.
alter table cases add column if not exists subcategory text;
alter table cases add column if not exists specific_issue text;
alter table cases add column if not exists state text;
alter table cases add column if not exists district text;
alter table institutions add column if not exists source_application_no text;
create unique index if not exists institutions_source_application_no_idx on institutions(source_application_no) where source_application_no is not null;
create index if not exists cases_structured_filters_idx on cases(category, subcategory, specific_issue, state, district);

create table if not exists institution_verification_requests (
  id uuid primary key default gen_random_uuid(),
  submitted_name text not null,
  state text,
  district text,
  details text not null,
  contact_email text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'declined')),
  created_at timestamptz not null default now()
);

create table if not exists administrative_states (
  id text primary key,
  name text not null unique,
  kind text not null check (kind in ('state', 'union_territory')),
  source_url text not null,
  source_updated_at date
);
create table if not exists administrative_districts (
  id text primary key,
  state_id text not null references administrative_states(id),
  name text not null,
  source_url text not null,
  source_updated_at date,
  unique (state_id, name)
);
create index if not exists administrative_districts_state_idx on administrative_districts(state_id, name);
