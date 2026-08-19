-- ============================================================
-- Migration 0013: SuperGrok OAuth token store
-- Holds the xAI (Grok) OAuth refresh token obtained by a one-time local
-- login (scripts/grok-login.mjs) using your SuperGrok / X Premium+
-- subscription. The Vercel server reads the refresh token to mint fresh
-- access tokens on demand — so Grok works from any device with NO per-token
-- API key.
--
-- SECURITY: RLS is enabled with NO policies, so anon/authenticated users
-- get ZERO access. Only the service_role key (server-side, which bypasses
-- RLS) can read or write these tokens. They are never exposed to the browser.
-- ============================================================

create table grok_oauth_tokens (
  id                       int primary key default 1,
  refresh_token            text not null,
  access_token             text,
  access_token_expires_at  timestamptz,
  scope                    text,
  updated_at               timestamptz not null default now(),
  constraint grok_oauth_singleton check (id = 1)  -- exactly one row
);

alter table grok_oauth_tokens enable row level security;
-- (intentionally no policies — service_role only)
