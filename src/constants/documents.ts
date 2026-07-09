/**
 * Límites de subida de documentos. El bucket "documents" de Supabase
 * impone los mismos valores en el servidor (file_size_limit y
 * allowed_mime_types en la migración de storage): cambiar esto sin
 * cambiar el bucket solo endurece el cliente, nunca lo relaja.
 */
export const DOCUMENT_MAX_SIZE_MB = 50;
export const DOCUMENT_MAX_SIZE_BYTES = DOCUMENT_MAX_SIZE_MB * 1024 * 1024;
export const DOCUMENT_MIME_TYPE = "application/pdf";
export const DOCUMENT_EXTENSION = ".pdf";
export const DOCUMENTS_BUCKET = "documents";
