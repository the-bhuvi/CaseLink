-- CASELINK AI Supabase schema
-- Run this file in Supabase SQL Editor. It is repeatable and does not drop data.

create extension if not exists pgcrypto;

create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  aicte_permanent_id text unique,
  name text not null,
  normalized_name text not null,
  institution_type text not null default 'Unknown',
  state text not null default 'Unknown',
  district text not null default 'Unknown',
  address text,
  created_at timestamptz not null default now()
);
create index if not exists institutions_normalized_name_idx on institutions (normalized_name);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  institution_id uuid references institutions(id),
  submitted_institution_name text not null,
  submitted_institution_id text,
  category text not null,
  subject text not null,
  description text not null,
  source_channel text not null default 'web',
  assigned_bureau text not null check (assigned_bureau in ('RB', 'PGRC')),
  assigned_officer_id uuid,
  status text not null default 'received' check (status in ('received','under_review','in_progress','awaiting_information','escalated','disposed')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  next_action text,
  due_at timestamptz,
  closed_at timestamptz,
  complainant_name text,
  complainant_email text,
  public_status text not null default 'Received',
  is_synthetic boolean not null default false
);
create index if not exists cases_reference_idx on cases(reference);
create index if not exists cases_institution_idx on cases(institution_id);
create index if not exists cases_status_bureau_idx on cases(status, assigned_bureau);
create index if not exists cases_due_at_idx on cases(due_at);

create or replace function caselink_set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists cases_set_updated_at on cases;
create trigger cases_set_updated_at before update on cases for each row execute function caselink_set_updated_at();

create table if not exists case_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  actor_id uuid,
  action_type text not null,
  description text not null,
  previous_status text,
  new_status text,
  visibility text not null default 'internal' check (visibility in ('public','internal')),
  created_at timestamptz not null default now()
);
create index if not exists case_actions_case_created_idx on case_actions(case_id, created_at);

create table if not exists case_relationships (
  id uuid primary key default gen_random_uuid(),
  case_a_id uuid not null references cases(id) on delete cascade,
  case_b_id uuid not null references cases(id) on delete cascade,
  semantic_similarity double precision,
  relationship_score double precision,
  relationship_type text not null default 'potential_overlap',
  match_explanation text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  review_status text not null default 'pending' check (review_status in ('pending','confirmed','rejected','needs_review')),
  reviewed_by uuid,
  review_reason text,
  reviewed_at timestamptz,
  model_version text,
  created_at timestamptz not null default now(),
  constraint case_relationships_ordered check (case_a_id < case_b_id),
  constraint case_relationships_unique_pair unique (case_a_id, case_b_id)
);
create index if not exists case_relationships_status_idx on case_relationships(review_status);

create table if not exists coordination_alerts (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid references case_relationships(id) on delete cascade,
  case_id uuid references cases(id) on delete cascade,
  title text not null,
  reason text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  recommended_action text not null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists coordination_alerts_status_idx on coordination_alerts(status);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  content_type text not null,
  size_bytes integer not null,
  visibility text not null default 'internal' check (visibility in ('public','internal')),
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete set null,
  institution_id uuid references institutions(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_unread_idx on notifications(is_read, created_at);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

-- Backend uses the service-role key only. Browser clients must never receive it.
-- Keep complaint tables private from anon/authenticated roles unless you explicitly
-- add narrowly scoped policies for a future authenticated architecture.
alter table institutions enable row level security;
alter table cases enable row level security;
alter table case_actions enable row level security;
alter table case_relationships enable row level security;
alter table coordination_alerts enable row level security;
alter table attachments enable row level security;
alter table notifications enable row level security;
alter table audit_events enable row level security;

insert into storage.buckets (id, name, public)
values ('caselink-private', 'caselink-private', false)
on conflict (id) do update set public = false;
