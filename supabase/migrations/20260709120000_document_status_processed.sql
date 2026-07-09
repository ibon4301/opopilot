-- ============================================================
-- Fase 4: se añade el estado terminal 'processed' al pipeline
-- de documentos. Semántica definitiva:
--   uploading → ready (subido, pendiente de procesar)
--   ready → processing → processed | failed  (Fase 5)
-- ============================================================

alter type public.document_status add value if not exists 'processed';

comment on column public.documents.status is
  'uploading → ready (subido) → processing → processed | failed';
