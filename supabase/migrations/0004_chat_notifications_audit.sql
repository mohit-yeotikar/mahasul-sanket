-- ============================================================
-- Migration 0004: AI chat history, bookmarks, feedback,
-- notifications, audit logs, settings
-- ============================================================

create table conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null default 'नवीन संभाषण',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_user on conversations(user_id, updated_at desc);
create trigger trg_conversations_updated before update on conversations
  for each row execute function set_updated_at();

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  -- assistant metadata
  confidence      numeric(5,2),
  citations       jsonb not null default '[]',  -- [{document_id,title,page,gr_number,circular_number,similarity}]
  related_questions jsonb not null default '[]',
  ticket_id       uuid references tickets(id),  -- set if this answer escalated to a ticket
  created_at      timestamptz not null default now()
);

create index idx_messages_conversation on messages(conversation_id, created_at);

create table bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  message_id uuid references messages(id) on delete cascade,
  document_id uuid references documents(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now(),
  check (message_id is not null or document_id is not null)
);

create table feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id),
  message_id uuid references messages(id) on delete set null,
  rating     int check (rating between 1 and 5),
  is_helpful boolean,
  comment    text,
  created_at timestamptz not null default now()
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text,
  link       text,                -- in-app route, e.g. /tickets/MS-2026-000123
  ticket_id  uuid references tickets(id) on delete cascade,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, is_read, created_at desc);

create table audit_logs (
  id         bigint generated always as identity primary key,
  actor_id   uuid references profiles(id),
  action     text not null,        -- e.g. user.verified, document.approved, ticket.sla_set
  entity     text,                 -- table/module name
  entity_id  text,
  detail     jsonb not null default '{}',
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_audit_actor on audit_logs(actor_id, created_at desc);

create table app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values
  ('ai', '{"provider":"gemini","chat_model":"gemini-2.0-flash","embedding_model":"text-embedding-004","confidence_threshold":60}'),
  ('sla_defaults', '{"low":7,"medium":5,"high":3,"critical":1}');
