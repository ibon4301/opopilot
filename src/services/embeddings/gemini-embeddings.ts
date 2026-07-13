import { serverEnv } from "@/config/env.server";
import { getGeminiClient } from "@/services/gemini/client";
import { describeGeminiApiError } from "@/services/gemini/errors";

import {
  EmbeddingError,
  type EmbeddingTask,
  type EmbedFn,
} from "./embedding-client";

/**
 * Modelo y dimensión acoplados al esquema: document_chunks.embedding es
 * vector(1536) y gemini-embedding-001 permite fijar esa dimensión con
 * outputDimensionality. Cambiar de modelo o dimensión implica migrar la
 * columna y re-embeber todos los documentos.
 */
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 1536;

const TASK_TYPE: Record<EmbeddingTask, string> = {
  document: "RETRIEVAL_DOCUMENT",
  query: "RETRIEVAL_QUERY",
};

/**
 * Gemini solo devuelve vectores normalizados en su dimensión nativa
 * (3072); con outputDimensionality reducida hay que renormalizar, como
 * recomienda la propia documentación de Google.
 */
function normalize(values: number[]): number[] {
  const norm = Math.hypot(...values);
  return norm === 0 ? values : values.map((value) => value / norm);
}

/** Genera embeddings para un lote de textos con la API de Gemini. */
export const embedTexts: EmbedFn = async (texts, task) => {
  if (!serverEnv.geminiApiKey) {
    throw new EmbeddingError(
      "GEMINI_API_KEY no está configurada. Añádela a .env y reinicia el servidor.",
    );
  }

  const gemini = getGeminiClient();

  try {
    const response = await gemini.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: texts,
      config: {
        taskType: TASK_TYPE[task],
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });

    const embeddings = response.embeddings ?? [];
    if (
      embeddings.length !== texts.length ||
      embeddings.some((e) => !e.values)
    ) {
      throw new Error(
        `Respuesta de Gemini incompleta: ${embeddings.length} embeddings para ${texts.length} textos.`,
      );
    }

    return embeddings.map((embedding) => normalize(embedding.values!));
  } catch (error) {
    const friendly = describeGeminiApiError(error);
    if (friendly) {
      throw new EmbeddingError(friendly);
    }
    throw error;
  }
};
