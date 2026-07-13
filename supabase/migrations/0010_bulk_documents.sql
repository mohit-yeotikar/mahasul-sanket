-- ============================================================
-- Migration 0010: Bulk document ingestion support
--   content_hash — exact-duplicate detection across uploads
--   category     — AI-assigned service category (mirrors ticket categories)
-- ============================================================

alter table documents add column if not exists content_hash text;
alter table documents add column if not exists category text;

create index if not exists idx_documents_content_hash on documents(content_hash);
create index if not exists idx_documents_category on documents(category);
