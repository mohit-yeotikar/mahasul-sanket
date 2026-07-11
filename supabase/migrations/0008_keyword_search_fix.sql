-- ============================================================
-- Migration 0008: Harden keyword search.
-- The % operator depends on a session-scoped threshold (set_limit),
-- which does NOT persist for the app's connections. Use explicit
-- similarity() comparisons instead so results are deterministic.
-- ============================================================

create or replace function search_knowledge_keyword(
  query_text text,
  match_count int default 8
) returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  page_number int,
  title text,
  doc_type document_type,
  gr_number text,
  circular_number text,
  department text,
  issued_date date,
  similarity float
)
language sql stable security definer set search_path = public as $$
  select
    c.id, c.document_id, c.content, c.page_number,
    d.title, d.doc_type, d.gr_number, d.circular_number, d.department, d.issued_date,
    greatest(
      similarity(c.content, query_text),
      similarity(d.title, query_text) * 0.9,
      case when c.content ilike '%' || query_text || '%' then 0.6 else 0 end,
      case when d.gr_number is not null and query_text ilike '%' || d.gr_number || '%'
           then 0.95 else 0 end
    )::float as sim
  from document_chunks c
  join documents d on d.id = c.document_id
  where d.status = 'approved'
    and (
      similarity(c.content, query_text) > 0.18
      or similarity(d.title, query_text) > 0.25
      or c.content ilike '%' || query_text || '%'
      or (d.gr_number is not null and query_text ilike '%' || d.gr_number || '%')
    )
  order by sim desc
  limit match_count;
$$;
