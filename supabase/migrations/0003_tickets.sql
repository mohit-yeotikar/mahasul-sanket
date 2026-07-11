-- ============================================================
-- Migration 0003: Tickets, 4-level escalation, SLA, replies
-- L1 Talathi → L2 Nayab Tahsildar → L3 DCO → L4 District Admin
-- ============================================================

create sequence ticket_number_seq;

create table tickets (
  id             uuid primary key default gen_random_uuid(),
  ticket_number  text not null unique
                 default 'MS-' || to_char(now(),'YYYY') || '-' || lpad(nextval('ticket_number_seq')::text, 6, '0'),
  subject        text not null,
  description    text not null,
  category       ticket_category not null default 'others',
  priority       ticket_priority not null default 'medium',
  status         ticket_status not null default 'open',
  current_level  escalation_level not null default 'L2',  -- tickets start with Nayab Tahsildar
  created_by     uuid not null references profiles(id),
  assigned_to    uuid references profiles(id),
  district_id    uuid not null references districts(id),
  taluka_id      uuid references talukas(id),
  -- AI context: the low-confidence question that spawned this ticket
  source_question   text,
  ai_answer_draft   text,
  ai_confidence     numeric(5,2),
  -- SLA: any L2+ officer can promise a resolution time in DAYS.
  sla_days          int check (sla_days > 0),
  sla_set_by        uuid references profiles(id),
  sla_set_by_level  escalation_level,
  sla_due_at        timestamptz,
  resolved_at    timestamptz,
  closed_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_tickets_district on tickets(district_id);
create index idx_tickets_status on tickets(status);
create index idx_tickets_created_by on tickets(created_by);
create index idx_tickets_assigned_to on tickets(assigned_to);

create trigger trg_tickets_updated before update on tickets
  for each row execute function set_updated_at();

alter table knowledge_proposals
  add constraint fk_proposal_ticket foreign key (ticket_id) references tickets(id);

-- Every reply / note / event on a ticket. is_internal notes are hidden from the Talathi.
create table ticket_replies (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  body        text not null,
  is_internal boolean not null default false,
  attachments jsonb not null default '[]',   -- [{path, name, mime, size}]
  created_at  timestamptz not null default now()
);

create index idx_replies_ticket on ticket_replies(ticket_id);

-- Escalation history: who escalated, from which level to which, and why.
create table ticket_escalations (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  from_level   escalation_level not null,
  to_level     escalation_level not null,
  escalated_by uuid not null references profiles(id),
  reason       text,
  created_at   timestamptz not null default now()
);

-- Full audit timeline of status/priority/assignment changes.
create table ticket_events (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  actor_id    uuid references profiles(id),
  event_type  text not null,        -- status_changed | assigned | sla_set | escalated | reopened ...
  old_value   text,
  new_value   text,
  created_at  timestamptz not null default now()
);

create index idx_events_ticket on ticket_events(ticket_id);

-- When SLA days are set, compute due date automatically.
create or replace function apply_sla() returns trigger
language plpgsql as $$
begin
  if new.sla_days is not null and (old.sla_days is distinct from new.sla_days) then
    new.sla_due_at := now() + make_interval(days => new.sla_days);
  end if;
  return new;
end $$;

create trigger trg_tickets_sla before update on tickets
  for each row execute function apply_sla();
