import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import type { EmbedFn } from "@/services/embeddings/embedding-client";

/**
 * Recuperación del contexto de un documento para generación con IA
 * (tests, flashcards…). Dos estrategias:
 *
 * - Tema concreto: embedding de la consulta (los de los chunks ya
 *   existen y nunca se recalculan) + top-k por similitud dentro del
 *   documento vía la RPC match_document_chunks.
 * - Documento completo: muestreo uniforme de chunks a lo largo del
 *   documento, sin ninguna llamada al proveedor de embeddings.
 *
 * Nunca se envía el documento entero: cada consumidor fija su
 * presupuesto de chunks (~275 tokens por chunk).
 */

/** Error con mensaje pensado para mostrarse al usuario tal cual. */
export class DocumentContextError extends Error {}

/** Por debajo de esta similitud, el tema no está en el documento. */
const TOPIC_MIN_SIMILARITY = 0.35;

type Supabase = SupabaseClient<Database>;

export interface ContextChunk {
  id: string;
  content: string;
  pageNumber: number | null;
}

/** Documento del usuario listo para generar contenido (status embedded). */
export async function getGenerableDocument(
  supabase: Supabase,
  documentId: string,
) {
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, filename, status")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!document) {
    throw new DocumentContextError("El documento no existe.");
  }
  if (document.status !== "embedded") {
    throw new DocumentContextError(
      "El documento aún no está indexado. Procésalo y genera sus embeddings antes de usarlo.",
    );
  }
  return document;
}

export interface TopicContextParams {
  supabase: Supabase;
  embed: EmbedFn;
  documentId: string;
  topic: string;
  maxChunks: number;
}

/** Top-k de chunks del documento más similares al tema. */
export async function getTopicContext({
  supabase,
  embed,
  documentId,
  topic,
  maxChunks,
}: TopicContextParams): Promise<ContextChunk[]> {
  const [queryEmbedding] = await embed([topic], "query");

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: maxChunks,
    filter_document_id: documentId,
  });

  if (error) {
    throw error;
  }

  const relevant = data.filter(
    (match) => match.similarity >= TOPIC_MIN_SIMILARITY,
  );
  if (relevant.length === 0) {
    throw new DocumentContextError(
      "No se ha encontrado contenido sobre ese tema en el documento. Prueba a formularlo de otra manera.",
    );
  }

  return relevant.map((match) => ({
    id: match.chunk_id,
    content: match.content,
    pageNumber: match.page_number,
  }));
}

export interface FullDocumentContextParams {
  supabase: Supabase;
  documentId: string;
  maxChunks: number;
}

/** Muestreo uniforme de chunks a lo largo del documento completo. */
export async function getFullDocumentContext({
  supabase,
  documentId,
  maxChunks,
}: FullDocumentContextParams): Promise<ContextChunk[]> {
  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id, content, page_number")
    .eq("document_id", documentId)
    .order("chunk_index");

  if (error) {
    throw error;
  }
  if (chunks.length === 0) {
    throw new DocumentContextError(
      "El documento no tiene fragmentos. Procésalo primero.",
    );
  }

  return sampleEvenly(chunks, maxChunks).map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    pageNumber: chunk.page_number,
  }));
}

function sampleEvenly<T>(items: T[], max: number): T[] {
  if (items.length <= max) {
    return items;
  }
  const step = items.length / max;
  const sampled: T[] = [];
  for (let index = 0; index < max; index++) {
    const item = items[Math.floor(index * step)];
    if (item !== undefined) {
      sampled.push(item);
    }
  }
  return sampled;
}
