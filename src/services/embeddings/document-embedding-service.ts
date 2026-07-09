import { logActionError } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";

import { EmbeddingError, type EmbedFn } from "./embedding-client";
import { embedTexts } from "./gemini-embeddings";

/**
 * Límite conservador por petición al proveedor: por debajo del tope de
 * lote de Gemini (250 inputs) y amable con los rate limits de la capa
 * gratuita, con chunks de ~275 tokens.
 */
const EMBEDDING_BATCH_SIZE = 100;

export interface EmbeddingRunResult {
  embeddedCount: number;
  totalChunks: number;
}

interface EmbedDocumentOptions {
  /** true = re-embebe todos los chunks, no solo los pendientes. */
  force?: boolean;
  /** Inyectable para tests; por defecto, Gemini. */
  embedder?: EmbedFn;
}

/**
 * Genera y persiste los embeddings pendientes de un documento.
 *
 * Idempotente y reanudable: solo procesa chunks con embedding NULL
 * (salvo `force`), y cada lote se guarda al completarse — si el
 * proveedor falla a mitad, el progreso anterior queda persistido y la
 * siguiente ejecución continúa donde se quedó, sin duplicar llamadas.
 * Al terminar sin pendientes, el documento pasa a status `embedded`.
 */
export async function embedDocumentChunks(
  documentId: string,
  { force = false, embedder = embedTexts }: EmbedDocumentOptions = {},
): Promise<EmbeddingRunResult> {
  const supabase = createAdminClient();

  const { count: totalChunks, error: countError } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true })
    .eq("document_id", documentId);

  if (countError) {
    throw countError;
  }
  if (!totalChunks) {
    throw new EmbeddingError(
      "El documento no tiene fragmentos. Procésalo primero.",
    );
  }

  let pendingQuery = supabase
    .from("document_chunks")
    .select("id, content")
    .eq("document_id", documentId)
    .order("chunk_index");

  if (!force) {
    pendingQuery = pendingQuery.is("embedding", null);
  }

  const { data: pending, error: pendingError } = await pendingQuery;
  if (pendingError) {
    throw pendingError;
  }

  let embeddedCount = 0;

  for (let i = 0; i < pending.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = pending.slice(i, i + EMBEDDING_BATCH_SIZE);
    const vectors = await embedder(
      batch.map((chunk) => chunk.content),
      "document",
    );

    if (vectors.length !== batch.length) {
      throw new Error(
        `Embeddings desalineados: ${vectors.length} vectores para ${batch.length} chunks.`,
      );
    }

    for (const [index, chunk] of batch.entries()) {
      const { error: updateError } = await supabase
        .from("document_chunks")
        .update({ embedding: JSON.stringify(vectors[index]) })
        .eq("id", chunk.id);

      if (updateError) {
        logActionError("embeddings.persist", updateError);
        throw updateError;
      }
    }

    embeddedCount += batch.length;
  }

  // Sin pendientes ⇒ el documento queda indexado para búsqueda.
  const { error: statusError } = await supabase
    .from("documents")
    .update({ status: "embedded" })
    .eq("id", documentId)
    .in("status", ["processed", "embedded"]);

  if (statusError) {
    throw statusError;
  }

  return { embeddedCount, totalChunks };
}
