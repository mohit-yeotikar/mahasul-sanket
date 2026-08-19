-- ============================================================
-- Migration 0015: Citizen grievances (public submit + track)
-- Citizens submit a lightweight grievance without logging in (through a
-- service-role API) and track it by its GRV reference. Officers see and manage
-- the grievances for their district.
-- ============================================================

create type grievance_status as enum ('received', 'in_review', 'resolved', 'closed');

create sequence grievance_number_seq;

create table grievances (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique
               default 'GRV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('grievance_number_seq')::text, 6, '0'),
  citizen_name text not null,
  mobile       text not null,
  district_id  uuid references districts(id),
  taluka_id    uuid references talukas(id),
  category     ticket_category not null default 'others',
  subject      text not null,
  description  text not null,
  status       grievance_status not null default 'received',
  officer_note text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_grievances_district on grievances(district_id, status);
create index idx_grievances_ref on grievances(reference);

create trigger trg_grievances_updated before update on grievances
  for each row execute function set_updated_at();

alter table grievances enable row level security;

-- Public submit + track go through a service-role API (bypasses RLS). Officers
-- read + manage grievances in their own district; state level sees all.
create policy grievances_officer_read on grievances for select
  using (current_role_of() in ('nayab_tahsildar','dco','district_admin','state_admin','super_admin')
         and (is_state_level() or district_id = current_district()));
create policy grievances_officer_update on grievances for update
  using (current_role_of() in ('nayab_tahsildar','dco','district_admin','state_admin','super_admin')
         and (is_state_level() or district_id = current_district()));
