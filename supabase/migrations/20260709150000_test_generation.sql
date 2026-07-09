-- ============================================================
-- Fase 7: generación de tests con IA.
--
-- 1) tests.topic: tema concreto pedido por el usuario; null =
--    test sobre el documento completo.
--
-- 2) test_context_chunks: qué chunks formaron el contexto con el
--    que la IA generó cada test. Permite, en fases futuras,
--    explicar respuestas, enlazar a los apuntes, generar
--    flashcards del mismo material o analizar qué partes del
--    documento producen más fallos.
--
-- 3) match_document_chunks gana filter_document_id para
--    recuperar contexto de un único documento. Se recrea (drop +
--    create) en vez de sobrecargar: dos firmas con argumentos
--    solapados serían ambiguas para PostgREST.
-- ============================================================

alter table public.tests
  add column topic text
    check (topic is null or char_length(topic) between 1 and 200);

comment on column public.tests.topic is
  'Tema concreto solicitado al generar el test; null = documento completo.';

-- ------------------------------------------------------------
-- test_context_chunks
-- ------------------------------------------------------------

-- Igual que el resto de tablas "nietas": unique (id, user_id) en el
-- padre + FK compuesta en el hijo garantizan que el user_id
-- desnormalizado (necesario para RLS barata) no diverge del dueño.
alter table public.document_chunks
  add constraint document_chunks_id_user_id_key unique (id, user_id);

create table public.test_context_chunks (
  test_id uuid not null,
  chunk_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (test_id, chunk_id),
  foreign key (test_id, user_id)
    references public.tests (id, user_id) on delete cascade,
  -- Si se borra el documento, sus chunks caen en cascada y con ellos
  -- este vínculo; el test sobrevive (tests.document_id es set null).
  foreign key (chunk_id, user_id)
    references public.document_chunks (id, user_id) on delete cascade
);

comment on table public.test_context_chunks is
  'Chunks que formaron el contexto con el que la IA generó el test.';

create index test_context_chunks_chunk_id_idx
  on public.test_context_chunks (chunk_id);

create index test_context_chunks_user_id_idx
  on public.test_context_chunks (user_id);

alter table public.test_context_chunks enable row level security;

-- Sin update: el vínculo es inmutable. El borrado llega en cascada
-- desde tests o document_chunks.
grant select, insert on public.test_context_chunks to authenticated;
grant all on public.test_context_chunks to service_role;

create policy "Users can view their own test context"
  on public.test_context_chunks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own test context"
  on public.test_context_chunks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- match_document_chunks con filtro opcional por documento
-- ------------------------------------------------------------

drop function public.match_document_chunks(extensions.vector, integer);

create function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_count integer default 8,
  filter_document_id uuid default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_filename text,
  content text,
  page_number integer,
  similarity double precision
)
language sql
stable
set search_path = ''
as $$
  select
    c.id,
    c.document_id,
    d.filename,
    c.content,
    c.page_number,
    1 - (c.embedding operator(extensions.<=>) query_embedding)
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where c.user_id = (select auth.uid())
    and c.embedding is not null
    and (filter_document_id is null or c.document_id = filter_document_id)
  order by c.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 50)
$$;

revoke execute on function public.match_document_chunks(extensions.vector, integer, uuid)
  from public, anon;
grant execute on function public.match_document_chunks(extensions.vector, integer, uuid)
  to authenticated, service_role;
