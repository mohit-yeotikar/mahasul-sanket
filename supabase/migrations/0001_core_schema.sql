-- ============================================================
-- Mahasul Sanket — Core Schema
-- Migration 0001: extensions, enums, geography, users
-- ============================================================

create extension if not exists vector;        -- pgvector for AI embeddings
create extension if not exists pg_trgm;       -- keyword/fuzzy search

-- ---------- Enums ----------

create type user_role as enum (
  'talathi',           -- L1
  'circle_officer',    -- L1.5
  'nayab_tahsildar',   -- L2
  'dco',               -- L3
  'district_admin',    -- L4
  'state_admin',       -- L5
  'super_admin'        -- L6
);

create type account_status as enum ('pending_verification', 'active', 'suspended', 'rejected');

create type ticket_status as enum (
  'open', 'assigned', 'in_progress', 'waiting', 'resolved', 'closed', 'reopened'
);

create type ticket_priority as enum ('low', 'medium', 'high', 'critical');

create type ticket_category as enum (
  'mutation', 'seven_twelve', 'ferfar', 'crop_entry', 'inheritance',
  'revenue', 'survey', 'map', 'certificates', 'digital_signature',
  'technical_issue', 'others'
);

create type escalation_level as enum ('L1', 'L2', 'L3', 'L4');

create type document_status as enum ('processing', 'pending_approval', 'approved', 'rejected', 'archived');

create type document_type as enum ('gr', 'circular', 'faq', 'sop', 'notification', 'manual', 'other');

create type knowledge_proposal_status as enum ('proposed', 'approved', 'rejected');

create type notification_type as enum (
  'ticket_created', 'ticket_assigned', 'ticket_replied', 'ticket_escalated',
  'ticket_resolved', 'ticket_sla_set', 'account_verified', 'account_rejected',
  'knowledge_proposed', 'knowledge_approved', 'knowledge_rejected', 'system'
);

-- ---------- Geography ----------

create table districts (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null unique,
  name_mr     text not null,
  code        text not null unique,
  created_at  timestamptz not null default now()
);

create table talukas (
  id          uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id) on delete cascade,
  name_en     text not null,
  name_mr     text not null,
  code        text not null,
  created_at  timestamptz not null default now(),
  unique (district_id, code)
);

create table villages (
  id          uuid primary key default gen_random_uuid(),
  taluka_id   uuid not null references talukas(id) on delete cascade,
  name_en     text not null,
  name_mr     text not null,
  code        text,
  created_at  timestamptz not null default now()
);

-- ---------- Users ----------
-- profiles.id = auth.users.id (Supabase Auth). Registration creates a
-- 'pending_verification' profile; the district DCO activates it after
-- checking the Government ID.

create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null,
  mobile         text not null unique check (mobile ~ '^[6-9][0-9]{9}$'),
  government_id  text not null,                 -- e.g. Sevarth / employee ID
  role           user_role not null default 'talathi',
  status         account_status not null default 'pending_verification',
  district_id    uuid references districts(id),
  taluka_id      uuid references talukas(id),
  village_id     uuid references villages(id),
  preferred_lang text not null default 'mr' check (preferred_lang in ('mr','en','hi')),
  verified_by    uuid references profiles(id),
  verified_at    timestamptz,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_profiles_district on profiles(district_id);
create index idx_profiles_role on profiles(role);

-- ---------- Helper functions for RLS ----------

create or replace function current_role_of() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_district() returns uuid
language sql stable security definer set search_path = public as $$
  select district_id from profiles where id = auth.uid();
$$;

create or replace function is_state_level() returns boolean
language sql stable security definer set search_path = public as $$
  select role in ('state_admin','super_admin') from profiles where id = auth.uid();
$$;

create or replace function is_district_officer() returns boolean
language sql stable security definer set search_path = public as $$
  select role in ('dco','district_admin') from profiles where id = auth.uid();
$$;

-- ---------- updated_at trigger ----------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
