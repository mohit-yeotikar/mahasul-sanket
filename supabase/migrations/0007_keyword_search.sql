-- ============================================================
-- Migration 0007: Local-first keyword search (no AI needed)
-- Pure-Postgres retrieval so most questions never touch the
-- external AI provider. Trigram similarity works well for
-- Devanagari/Marathi text.
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
      similarity(c.content, query_text),          -- content match
      similarity(d.title, query_text) * 0.9,      -- title match
      case when d.gr_number is not null and query_text ilike '%' || d.gr_number || '%'
           then 0.95 else 0 end                   -- exact GR number in question
    )::float as sim
  from document_chunks c
  join documents d on d.id = c.document_id
  where d.status = 'approved'
    and (
      c.content % query_text
      or d.title % query_text
      or c.content ilike '%' || query_text || '%'
      or (d.gr_number is not null and query_text ilike '%' || d.gr_number || '%')
    )
  order by sim desc
  limit match_count;
$$;

-- Trigram indexes already exist (0002). Lower the similarity threshold a bit
-- for Devanagari, where trigrams are sparser than Latin text.
select set_limit(0.2);
