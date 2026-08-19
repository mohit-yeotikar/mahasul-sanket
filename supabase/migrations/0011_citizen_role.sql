-- ============================================================
-- Migration 0011: Citizen role
-- Adds a public "citizen" role so ordinary people can use the app
-- with a limited feature set (AI chat, information feed, area officer
-- directory, Seva links). Citizens self-register and are active
-- immediately — NO DCO verification (they have no Government ID).
--
-- IMPORTANT: Postgres cannot use a newly added enum value in the SAME
-- transaction that adds it. So this migration adds ONLY the enum value.
-- Run it FIRST (click Run), then run 0012_citizen_directory.sql.
-- ============================================================

alter type user_role add value if not exists 'citizen';
