-- ============================================================
-- Migration 0005: Row Level Security
-- The security model lives HERE, in the database itself.
-- Even an application bug cannot cross these walls.
-- ============================================================

alter table districts           enable row level security;
alter table talukas             enable row level security;
alter table villages            enable row level security;
alter table profiles            enable row level security;
alter table documents           enable row level security;
alter table document_chunks     enable row level security;
alter table knowledge_proposals enable row level security;
alter table tickets             enable row level security;
alter table ticket_replies      enable row level security;
alter table ticket_escalations  enable row level security;
alter table ticket_events       enable row level security;
alter table conversations       enable row level security;
alter table messages            enable row level security;
alter table bookmarks           enable row level security;
alter table feedback            enable row level security;
alter table notifications       enable row level security;
alter table audit_logs          enable row level security;
alter table app_settings        enable row level security;

-- ---------- Geography: readable by everyone (needed for registration) ----------
create policy geo_read_districts on districts for select using (true);
create policy geo_read_talukas   on talukas   for select using (true);
create policy geo_read_villages  on villages  for select using (true);
create policy geo_admin_districts on districts for all using (is_state_level());
create policy geo_admin_talukas   on talukas   for all using (is_state_level());
create policy geo_admin_villages  on villages  for all using (is_state_level());

-- ---------- Profiles ----------
-- Own profile: read + update (but role/status changes go through RPCs).
create policy profiles_own_read   on profiles for select using (id = auth.uid());
create policy profiles_own_update on profiles for update using (id = auth.uid());
-- Registration inserts own pending profile.
create policy profiles_self_insert on profiles for insert
  with check (id = auth.uid() and status = 'pending_verification' and role = 'talathi');
-- DCO / District Admin see all profiles in their district (to verify Talathis).
create policy profiles_district_read on profiles for select
  using (is_district_officer() and district_id = current_district());
create policy profiles_district_update on profiles for update
  using (is_district_officer() and district_id = current_district());
-- Nayab Tahsildar can see profiles in own district (ticket context).
create policy profiles_l2_read on profiles for select
  using (current_role_of() = 'nayab_tahsildar' and district_id = current_district());
-- State level sees everything.
create policy profiles_state_all on profiles for all using (is_state_level());

-- ---------- Knowledge: state-wide read for active users ----------
create or replace function is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select status = 'active' from profiles where id = auth.uid();
$$;

create policy docs_read on documents for select
  using (is_active_user() and status in ('approved','archived')
         or uploaded_by = auth.uid()
         or is_district_officer() or is_state_level());
create policy docs_manage on documents for all
  using (current_role_of() in ('district_admin','state_admin','super_admin')
         or (current_role_of() = 'dco' and (district_id = current_district() or district_id is null)));

create policy chunks_read on document_chunks for select using (is_active_user());
create policy chunks_manage on document_chunks for all
  using (current_role_of() in ('district_admin','state_admin','super_admin','dco'));

create policy proposals_read on knowledge_proposals for select
  using (proposed_by = auth.uid()
         or current_role_of() in ('district_admin','state_admin','super_admin'));
create policy proposals_insert on knowledge_proposals for insert
  with check (current_role_of() in ('dco','nayab_tahsildar') and proposed_by = auth.uid());
create policy proposals_review on knowledge_proposals for update
  using (current_role_of() in ('district_admin','state_admin','super_admin'));

-- ---------- Tickets: district-scoped ----------
-- Creator always sees own tickets.
create policy tickets_own on tickets for select using (created_by = auth.uid());
create policy tickets_create on tickets for insert
  with check (created_by = auth.uid() and is_active_user());
-- Officers (L2+) see tickets of their own district only; state sees all.
create policy tickets_officers_read on tickets for select
  using (
    is_state_level()
    or (current_role_of() in ('nayab_tahsildar','dco','district_admin','circle_officer')
        and district_id = current_district())
  );
create policy tickets_officers_update on tickets for update
  using (
    is_state_level()
    or (current_role_of() in ('nayab_tahsildar','dco','district_admin')
        and district_id = current_district())
  );
-- Creator may update own ticket (escalate / reopen / close).
create policy tickets_own_update on tickets for update using (created_by = auth.uid());

-- Replies: visible to ticket participants; internal notes hidden from L1.
create policy replies_read on ticket_replies for select
  using (
    exists (
      select 1 from tickets t where t.id = ticket_id and (
        (t.created_by = auth.uid() and not is_internal)
        or is_state_level()
        or (current_role_of() in ('nayab_tahsildar','dco','district_admin')
            and t.district_id = current_district())
      )
    )
  );
create policy replies_insert on ticket_replies for insert
  with check (
    author_id = auth.uid() and exists (
      select 1 from tickets t where t.id = ticket_id and (
        t.created_by = auth.uid()
        or is_state_level()
        or (current_role_of() in ('nayab_tahsildar','dco','district_admin')
            and t.district_id = current_district())
      )
    )
  );

create policy escalations_read on ticket_escalations for select
  using (exists (select 1 from tickets t where t.id = ticket_id and (
    t.created_by = auth.uid() or is_state_level()
    or (current_role_of() in ('nayab_tahsildar','dco','district_admin')
        and t.district_id = current_district()))));
create policy escalations_insert on ticket_escalations for insert
  with check (escalated_by = auth.uid());

create policy events_read on ticket_events for select
  using (exists (select 1 from tickets t where t.id = ticket_id and (
    t.created_by = auth.uid() or is_state_level()
    or (current_role_of() in ('nayab_tahsildar','dco','district_admin')
        and t.district_id = current_district()))));
create policy events_insert on ticket_events for insert with check (actor_id = auth.uid());

-- ---------- Personal data: strictly own ----------
create policy conv_own on conversations for all using (user_id = auth.uid());
create policy msg_own on messages for all
  using (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy bookmarks_own on bookmarks for all using (user_id = auth.uid());
create policy feedback_own_insert on feedback for insert with check (user_id = auth.uid());
create policy feedback_read on feedback for select
  using (user_id = auth.uid() or is_state_level() or is_district_officer());
create policy notif_own on notifications for select using (user_id = auth.uid());
create policy notif_own_update on notifications for update using (user_id = auth.uid());

-- ---------- Audit & settings ----------
create policy audit_read on audit_logs for select
  using (is_state_level()
         or (is_district_officer() and exists (
              select 1 from profiles p where p.id = audit_logs.actor_id
              and p.district_id = current_district())));
create policy settings_read on app_settings for select using (is_active_user());
create policy settings_write on app_settings for all
  using (current_role_of() in ('state_admin','super_admin'));
