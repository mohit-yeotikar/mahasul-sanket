-- ============================================================
-- Migration 0016: Broadcasts / announcements
-- Admins post announcements to their district (or state-wide); officers see the
-- ones in scope. Public submit is not involved — reads/writes are RLS-gated.
-- ============================================================

create table announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  district_id uuid references districts(id),   -- null = state-wide
  created_by  uuid references profiles(id),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_announcements_scope on announcements(district_id, created_at desc);

alter table announcements enable row level security;

-- Any active staff user sees state-wide announcements + those for their district.
create policy announcements_read on announcements for select
  using (
    is_active_user()
    and (district_id is null or district_id = current_district() or is_state_level())
  );

-- District/State/Super admins post; district admins are constrained to their
-- own district by the server action.
create policy announcements_write on announcements for insert
  with check (current_role_of() in ('district_admin','state_admin','super_admin'));

create policy announcements_delete on announcements for delete
  using (current_role_of() in ('district_admin','state_admin','super_admin'));
