"use server";

import { revalidatePath } from "next/cache";

import {
  GENERIC_ACTION_ERROR,
  SESSION_EXPIRED_ERROR,
} from "@/constants/errors";
import { ROUTES } from "@/constants/routes";
import { logActionError } from "@/lib/log";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import {
  documentIdSchema,
  searchQuerySchema,
} from "@/lib/validations/documents";
import {
  embedDocumentChunks,
  type EmbeddingRunResult,
} from "@/services/embeddings/document-embedding-service";
import { EmbeddingError } from "@/services/embeddings/embedding-client";
import { embedTexts } from "@/services/embeddings/gemini-embeddings";
import type { ActionResult } from "@/types";

const SEARCH_RESULT_COUNT = 8;

export type SearchResult =
  Database["public"]["Functions"]["match_document_chunks"]["Returns"][number];

function toFriendlyError(error: unknown): string {
  return error instanceof EmbeddingError
    ? error.message
    : "No se pudieron generar los embeddings. Inténtalo de nuevo.";
}

/**
 * Comprueba en contexto de usuario (RLS) que el documento existe y
 * está en un estado válido antes de tocar el proveedor de embeddings.
 */
async function validateDocumentForEmbedding(
  documentId: string,
  allowedStatuses: Database["public"]["Enums"]["document_status"][],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("id, status")
    .eq("id", documentId)
    .maybeSingle();

  if (!document) {
    return { ok: false, error: "El documento no existe." };
  }
  if (!allowedStatuses.includes(document.status)) {
    return {
      ok: false,
      error:
        document.status === "embedded"
          ? "El documento ya tiene embeddings. Usa «Regenerar embeddings» si quieres rehacerlos."
          : "Procesa el documento antes de generar embeddings.",
    };
  }
  return { ok: true };
}

export async function generateEmbeddingsAction(
  documentId: string,
): Promise<ActionResult<EmbeddingRunResult>> {
  const parsedId = documentIdSchema.safeParse(documentId);
  if (!parsedId.success) {
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const validation = await validateDocumentForEmbedding(parsedId.data, [
    "processed",
  ]);
  if (!validation.ok) {
    return { success: false, error: validation.error };
  }

  try {
    const result = await embedDocumentChunks(parsedId.data);
    revalidatePath(ROUTES.documents);
    return { success: true, data: result };
  } catch (error) {
    logActionError("embeddings.generate", error);
    return { success: false, error: toFriendlyError(error) };
  }
}

export async function regenerateEmbeddingsAction(
  documentId: string,
): Promise<ActionResult<EmbeddingRunResult>> {
  const parsedId = documentIdSchema.safeParse(documentId);
  if (!parsedId.success) {
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const validation = await validateDocumentForEmbedding(parsedId.data, [
    "processed",
    "embedded",
  ]);
  if (!validation.ok) {
    return { success: false, error: validation.error };
  }

  try {
    const result = await embedDocumentChunks(parsedId.data, { force: true });
    revalidatePath(ROUTES.documents);
    return { success: true, data: result };
  } catch (error) {
    logActionError("embeddings.regenerate", error);
    return { success: false, error: toFriendlyError(error) };
  }
}

/**
 * Búsqueda semántica sobre los documentos del usuario. Antes de gastar
 * una llamada al proveedor de embeddings comprueba que hay algo
 * indexado; la RPC corre como el usuario (security invoker), así que
 * RLS limita los resultados a sus chunks.
 */
export async function searchDocumentsAction(
  query: string,
): Promise<ActionResult<SearchResult[]>> {
  const parsedQuery = searchQuerySchema.safeParse(query);
  if (!parsedQuery.success) {
    return {
      success: false,
      error: parsedQuery.error.issues[0]?.message ?? GENERIC_ACTION_ERROR,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const supabase = await createClient();

  const { count: embeddedCount } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true })
    .not("embedding", "is", null);

  if (!embeddedCount) {
    return {
      success: false,
      error:
        "No tienes documentos indexados todavía. Genera los embeddings de un documento procesado.",
    };
  }

  try {
    const [queryEmbedding] = await embedTexts([parsedQuery.data], "query");

    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: SEARCH_RESULT_COUNT,
    });

    if (error) {
      logActionError("embeddings.search", error);
      return { success: false, error: GENERIC_ACTION_ERROR };
    }

    return { success: true, data };
  } catch (error) {
    logActionError("embeddings.search", error);
    return {
      success: false,
      error:
        error instanceof EmbeddingError
          ? error.message
          : "La búsqueda ha fallado. Inténtalo de nuevo.",
    };
  }
}
