import { serverEnv } from "@/config/env.server";
import { getGeminiClient } from "@/services/gemini/client";
import { describeGeminiApiError } from "@/services/gemini/errors";

import {
  FlashcardGenerationError,
  type GenerateFlashcardsFn,
} from "./provider";
import { deckOutputJsonSchema } from "./schemas";

/**
 * Modelo único por política de costes: la prioridad es minimizar el
 * consumo por generación manteniendo calidad suficiente para
 * flashcards. Sin cadenas de fallback a modelos más caros: si no está
 * disponible se devuelve un error controlado, nunca se cambia de
 * modelo automáticamente.
 */
export const FLASHCARD_GENERATION_MODEL = "gemini-3.1-flash-lite";

const MODEL_UNAVAILABLE_ERROR = `El modelo de IA (${FLASHCARD_GENERATION_MODEL}) no está disponible en este momento. Inténtalo más tarde.`;

/**
 * Llama a Gemini en modo de salida estructurada: el modelo está
 * obligado a responder JSON conforme al schema, así que nunca se
 * parsea texto libre. Temperatura baja y sin presupuesto de
 * "thinking": salida estable y coste mínimo por llamada.
 */
export const generateFlashcardsWithGemini: GenerateFlashcardsFn = async (
  prompt,
) => {
  if (!serverEnv.geminiApiKey) {
    throw new FlashcardGenerationError(
      "GEMINI_API_KEY no está configurada. Añádela a .env y reinicia el servidor.",
    );
  }

  const gemini = getGeminiClient();

  try {
    const response = await gemini.models.generateContent({
      model: FLASHCARD_GENERATION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: deckOutputJsonSchema,
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text;
    if (!text) {
      throw new FlashcardGenerationError(
        "La IA devolvió una respuesta vacía. Inténtalo de nuevo.",
      );
    }
    return text;
  } catch (error) {
    const friendly = describeGeminiApiError(error, {
      modelUnavailableMessage: MODEL_UNAVAILABLE_ERROR,
    });
    if (friendly) {
      throw new FlashcardGenerationError(friendly);
    }
    throw error;
  }
};
