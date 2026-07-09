-- ============================================================
-- Extensiones y utilidades comunes del esquema.
-- ============================================================

-- pgvector: embeddings para búsqueda semántica (Fase 6).
create extension if not exists vector with schema extensions;

-- Mantiene updated_at al día en cualquier tabla que lo tenga.
-- Se adjunta con: create trigger ... before update ... execute function public.set_updated_at();
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
