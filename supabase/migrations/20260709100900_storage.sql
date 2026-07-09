-- ============================================================
-- Storage: bucket privado "documents" para los PDFs (Fase 4).
--
-- Convención de rutas: {user_id}/{document_id}.pdf
-- Las policies usan el primer segmento de la ruta como dueño,
-- así cada usuario solo accede a su propia carpeta.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800, -- 50 MB
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can view their own files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
