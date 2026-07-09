-- ============================================================
-- documents: PDFs subidos por el usuario (Fases 4-5).
-- document_chunks: fragmentos del pipeline de procesamiento,
--   con embedding pgvector para búsqueda semántica (Fase 6).
--
-- unique (id, user_id) en documents permite FKs compuestas desde
-- las tablas hijas: el user_id desnormalizado (necesario para RLS
-- barata) no puede divergir del dueño real del documento.
-- ============================================================

create type public.document_status as enum (
  'uploading',
  'processing',
  'ready',
  'failed'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  filename text not null check (char_length(filename) between 1 and 255),
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  storage_path text not null unique,
  mime_type text not null default 'application/pdf',
  size_bytes bigint not null check (size_bytes > 0),
  page_count integer check (page_count > 0),
  status public.document_status not null default 'uploading',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on table public.documents is 'PDFs subidos por el usuario; status refleja el pipeline de procesamiento.';
comment on column public.documents.filename is 'Nombre saneado que se muestra en la UI.';
comment on column public.documents.original_filename is 'Nombre del archivo tal y como se subió.';
comment on column public.documents.storage_path is 'Ruta en el bucket "documents": {user_id}/{document_id}.pdf.';

create index documents_user_id_created_at_idx
  on public.documents (user_id, created_at desc);

create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

grant select, insert, delete on public.documents to authenticated;
-- id, user_id, storage_path y timestamps quedan fuera del update del cliente.
grant update (filename, status, error_message, page_count, processed_at)
  on public.documents to authenticated;
grant all on public.documents to service_role;

create policy "Users can view their own documents"
  on public.documents for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own documents"
  on public.documents for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- document_chunks
-- ------------------------------------------------------------

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  user_id uuid not null,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (char_length(content) > 0),
  token_count integer check (token_count > 0),
  page_number integer check (page_number > 0),
  -- Cualificado con "extensions.": en Supabase Cloud las migraciones
  -- corren sin ese esquema en el search_path.
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index),
  foreign key (document_id, user_id)
    references public.documents (id, user_id) on delete cascade
);

comment on table public.document_chunks is 'Fragmentos de texto por documento; embedding (1536 dims, cosine) para búsqueda semántica.';

create index document_chunks_user_id_idx
  on public.document_chunks (user_id);

create index document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.document_chunks enable row level security;

grant select on public.document_chunks to authenticated;
grant all on public.document_chunks to service_role;

-- Solo lectura para el usuario: los chunks los escribe el pipeline
-- de procesamiento con el service role (bypassa RLS).
create policy "Users can view their own document chunks"
  on public.document_chunks for select
  to authenticated
  using ((select auth.uid()) = user_id);
