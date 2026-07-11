-- ============================================================
-- Migration 0002: Knowledge base, documents, embeddings, search
-- State-wide readable; managed by district_admin and above.
-- ============================================================

create table documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  title_mr      text,
  doc_type      document_type not null default 'other',
  gr_number     text,
  circular_number text,
  department    text,
  issued_date   date,
  year          int generated always as (extract(year from issued_date)::int) stored,
  district_id   uuid references districts(id),   -- null = state-wide
  file_path     text,                            -- Supabase Storage path
  file_mime     text,
  file_size     bigint,
  language      text not null default 'mr',
  tags          text[] not null default '{}',
  status        document_status not null default 'processing',
  version       int not null default 1,
  supersedes    uuid references documents(id),   -- version history chain
  uploaded_by   uuid not null references profiles(id),
  approved_by   uuid references profiles(id),
  summary       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_documents_type on documents(doc_type);
create index idx_documents_status on documents(status);
create index idx_documents_tags on documents using gin(tags);
create index idx_documents_title_trgm on documents using gin (title gin_trgm_ops);

create trigger trg_documents_updated before update on documents
  for each row execute function set_updated_at();

-- Chunks: the unit of AI retrieval. 768 dims = Gemini text-embedding-004.
-- If the embedding provider changes dimension, add a new column + reindex.

create table document_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references documents(id) on delete cascade,
  chunk_index  int not null,
  content      text not null,
  page_number  int,
  embedding    vector(768),
  token_count  int,
  created_at   timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index idx_chunks_document on document_chunks(document_id);
create index idx_chunks_embedding on document_chunks
  using hnsw (embedding vector_cosine_ops);
create index idx_chunks_content_trgm on document_chunks using gin (content gin_trgm_ops);

-- Hybrid search: semantic (cosine) + keyword (trigram) in one call.
create or replace function search_knowledge(
  query_embedding vector(768),
  query_text text,
  match_count int default 8,
  min_similarity float default 0.5
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
      1 - (c.embedding <=> query_embedding),
      similarity(c.content, query_text)
    ) as sim
  from document_chunks c
  join documents d on d.id = c.document_id
  where d.status = 'approved'
    and (
      1 - (c.embedding <=> query_embedding) > min_similarity
      or c.content % query_text
    )
  order by sim desc
  limit match_count;
$$;

-- Knowledge proposals: DCO proposes a generic ticket answer → Admin approves →
-- it is ingested as an FAQ document and becomes AI knowledge.

create table knowledge_proposals (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid,                              -- FK added in 0003
  question     text not null,
  answer       text not null,
  proposed_by  uuid not null references profiles(id),
  status       knowledge_proposal_status not null default 'proposed',
  reviewed_by  uuid references profiles(id),
  review_note  text,
  document_id  uuid references documents(id),     -- set once approved+ingested
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);
