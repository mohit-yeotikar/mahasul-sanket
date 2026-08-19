-- ============================================================
-- Migration 0014: Word-level keyword search
-- The previous function compared the WHOLE question string against each
-- document via trigram similarity, so a full sentence like
-- "फेरफार नोंदीची प्रक्रिया काय आहे?" scored ~0 even against a document that
-- literally contains "फेरफार". This version splits the question into words and
-- matches documents that contain those words (works well for Marathi), ranking
-- by the fraction of query words found.
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
  with words as (
    select distinct w
    from unnest(
      regexp_split_to_array(lower(regexp_replace(query_text, '[?.,!।;:()]', ' ', 'g')), '\s+')
    ) as w
    where length(w) >= 3
      and w not in (
        -- Marathi + English question/stop words that shouldn't drive retrieval
        'काय','आहे','आहेत','कसे','कशी','कसा','कधी','कुठे','कोण','कोणत्या','कोणते','कोणती',
        'म्हणजे','साठी','मध्ये','बाबत','नंतर','किती','कोणता','असते','करावी','करावे','करायची',
        'the','what','how','when','where','which','who','and','for','are','is','of','to','in','on','a','an'
      )
  )
  select
    c.id, c.document_id, c.content, c.page_number,
    d.title, d.doc_type, d.gr_number, d.circular_number, d.department, d.issued_date,
    (
      (select count(*) from words w
         where c.content ilike '%' || w.w || '%' or d.title ilike '%' || w.w || '%')::float
      / greatest((select count(*) from words), 1)
    )::float as sim
  from document_chunks c
  join documents d on d.id = c.document_id
  where d.status = 'approved'
    and (
      exists (
        select 1 from words w
        where c.content ilike '%' || w.w || '%' or d.title ilike '%' || w.w || '%'
      )
      or (d.gr_number is not null and query_text ilike '%' || d.gr_number || '%')
    )
  order by sim desc, length(c.content) asc
  limit match_count;
$$;
