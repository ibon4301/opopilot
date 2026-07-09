-- ============================================================
-- Fase 6: búsqueda semántica.
--
-- 1) Estado terminal 'embedded': el documento tiene todos sus
--    chunks con embedding. Semántica completa:
--    uploading → ready → processing → processed → embedded | failed
--
-- 2) RPC match_document_chunks: top-k de chunks por similitud
--    coseno. SECURITY INVOKER: corre como el usuario autenticado,
--    así que RLS aplica; el filtro explícito por auth.uid() añade
--    defensa en profundidad y ayuda al planificador. Aprovecha el
--    índice HNSW existente (document_chunks_embedding_idx).
-- ============================================================

alter type public.document_status add value if not exists 'embedded';

comment on column public.documents.status is
  'uploading → ready (subido) → processing → processed → embedded | failed';

create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_count integer default 8
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
  order by c.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 50)
$$;

revoke execute on function public.match_document_chunks(extensions.vector, integer)
  from public, anon;
grant execute on function public.match_document_chunks(extensions.vector, integer)
  to authenticated, service_role;
