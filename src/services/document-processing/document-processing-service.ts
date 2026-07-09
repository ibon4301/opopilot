import { DOCUMENTS_BUCKET } from "@/constants/documents";
import { logActionError } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";

import { extractPdfPages } from "./pdf-extractor";
import { chunkPages, type TextChunk } from "./text-chunker";
import { cleanPdfText } from "./text-cleaner";

/** Inserts por lotes para no exceder límites de payload de PostgREST. */
const CHUNK_INSERT_BATCH_SIZE = 100;
const ERROR_MESSAGE_MAX_LENGTH = 500;

export interface ProcessingResult {
  chunkCount: number;
  pageCount: number;
}

/** Error con mensaje pensado para mostrarse al usuario tal cual. */
export class DocumentProcessingError extends Error {}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Pipeline de procesamiento de un documento (Fase 5):
 *
 *   descargar PDF → extraer texto por página → limpiar → chunkear →
 *   persistir en document_chunks → status "processed".
 *
 * Corre con el service role: document_chunks solo admite escrituras del
 * servidor por diseño (Fase 3). El estado y el mensaje de error del
 * documento se actualizan aquí ante cualquier fallo, así que el caller
 * solo tiene que traducir la excepción a su formato de respuesta.
 * Los embeddings quedan en NULL: la Fase 6 solo recorre los chunks y
 * los rellena.
 */
export async function processDocument(
  documentId: string,
): Promise<ProcessingResult> {
  const supabase = createAdminClient();

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("id, user_id, storage_path")
    .eq("id", documentId)
    .single();

  if (fetchError || !document) {
    throw new DocumentProcessingError("El documento no existe.");
  }

  try {
    const pdfData = await downloadPdf(supabase, document.storage_path);

    const { pageCount, pages } = await extractPdfPages(pdfData).catch(() => {
      throw new DocumentProcessingError(
        "No se pudo leer el PDF. El archivo puede estar dañado o no ser un PDF válido.",
      );
    });

    const cleanedPages = pages
      .map((page) => ({
        pageNumber: page.pageNumber,
        text: cleanPdfText(page.text),
      }))
      .filter((page) => page.text.length > 0);

    const chunks = chunkPages(cleanedPages);
    if (chunks.length === 0) {
      throw new DocumentProcessingError(
        "El PDF no contiene texto extraíble. Si es un documento escaneado, necesita OCR (no soportado todavía).",
      );
    }

    await replaceChunks(supabase, document.id, document.user_id, chunks);

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "processed",
        page_count: pageCount,
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", document.id);

    if (updateError) {
      throw updateError;
    }

    return { chunkCount: chunks.length, pageCount };
  } catch (error) {
    await markAsFailed(supabase, document.id, error);
    throw error;
  }
}

async function downloadPdf(
  supabase: AdminClient,
  storagePath: string,
): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new DocumentProcessingError(
      "No se pudo descargar el archivo de Storage.",
    );
  }

  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Borra los chunks previos antes de insertar: reprocesar un documento
 * (p. ej. tras un fallo a mitad de escritura) siempre parte de cero y
 * chunk_index nunca colisiona.
 */
async function replaceChunks(
  supabase: AdminClient,
  documentId: string,
  userId: string,
  chunks: TextChunk[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId);

  if (deleteError) {
    throw deleteError;
  }

  const rows = chunks.map((chunk) => ({
    document_id: documentId,
    user_id: userId,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    token_count: chunk.tokenCount,
    page_number: chunk.pageNumber,
  }));

  for (let i = 0; i < rows.length; i += CHUNK_INSERT_BATCH_SIZE) {
    const { error } = await supabase
      .from("document_chunks")
      .insert(rows.slice(i, i + CHUNK_INSERT_BATCH_SIZE));

    if (error) {
      throw error;
    }
  }
}

async function markAsFailed(
  supabase: AdminClient,
  documentId: string,
  error: unknown,
): Promise<void> {
  const message =
    error instanceof DocumentProcessingError
      ? error.message
      : "Error inesperado durante el procesamiento.";

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      status: "failed",
      error_message: message.slice(0, ERROR_MESSAGE_MAX_LENGTH),
    })
    .eq("id", documentId);

  if (updateError) {
    logActionError("documents.process.markAsFailed", updateError);
  }
}
