import { ApiError } from "@google/genai";

import { serverEnv } from "@/config/env.server";
import { getGeminiClient } from "@/services/gemini/client";

import { TestGenerationError, type GenerateQuestionsFn } from "./provider";
import { testOutputJsonSchema } from "./schemas";

/**
 * gemini-2.5-flash (el objetivo original de esta fase) fue retirado de
 * la API en 2026 ("no longer available", 404). Se usa su sucesor
 * estable de la misma familia rápida/económica y, como la capa
 * gratuita del modelo más nuevo sufre picos de saturación (503), un
 * fallback de la misma familia que solo entra ante ese error.
 */
export const TEST_GENERATION_MODELS = [
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
] as const;

function isOverloaded(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503;
}

/**
 * Llama a Gemini en modo de salida estructurada: el modelo está
 * obligado a responder JSON conforme al schema, así que nunca se
 * parsea texto libre. Sin presupuesto de "thinking": generar preguntas
 * a partir de un contexto dado no lo necesita y abarata cada llamada.
 */
export const generateQuestionsWithGemini: GenerateQuestionsFn = async (
  prompt,
) => {
  if (!serverEnv.geminiApiKey) {
    throw new TestGenerationError(
      "GEMINI_API_KEY no está configurada. Añádela a .env y reinicia el servidor.",
    );
  }

  const gemini = getGeminiClient();

  try {
    let lastOverload: unknown = null;

    for (const model of TEST_GENERATION_MODELS) {
      try {
        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: testOutputJsonSchema,
            temperature: 0.4,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        const text = response.text;
        if (!text) {
          throw new TestGenerationError(
            "La IA devolvió una respuesta vacía. Inténtalo de nuevo.",
          );
        }
        return text;
      } catch (error) {
        if (isOverloaded(error)) {
          lastOverload = error;
          continue;
        }
        throw error;
      }
    }

    throw lastOverload;
  } catch (error) {
    if (error instanceof ApiError) {
      const invalidKey =
        error.status === 401 ||
        error.status === 403 ||
        (error.status === 400 && error.message.includes("API key"));
      if (invalidKey) {
        throw new TestGenerationError(
          "La API key de Gemini no es válida. Revisa GEMINI_API_KEY en .env.",
        );
      }
      if (error.status === 429) {
        throw new TestGenerationError(
          "Gemini está limitando las peticiones (capa gratuita). Espera un minuto y vuelve a intentarlo.",
        );
      }
      if (error.status === 503) {
        throw new TestGenerationError(
          "Los modelos de IA están saturados en este momento. Inténtalo de nuevo en unos segundos.",
        );
      }
    }
    throw error;
  }
};
