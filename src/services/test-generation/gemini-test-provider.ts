import { ApiError } from "@google/genai";

import { serverEnv } from "@/config/env.server";
import { getGeminiClient } from "@/services/gemini/client";

import { TestGenerationError, type GenerateQuestionsFn } from "./provider";
import { testOutputJsonSchema } from "./schemas";

/**
 * Modelo único por política de costes: la prioridad es minimizar el
 * consumo por generación manteniendo calidad suficiente para preguntas
 * tipo test. Sin cadenas de fallback a modelos más caros: si no está
 * disponible se devuelve un error controlado, nunca se cambia de
 * modelo automáticamente.
 */
export const TEST_GENERATION_MODEL = "gemini-3.1-flash";

const MODEL_UNAVAILABLE_ERROR = `El modelo de IA (${TEST_GENERATION_MODEL}) no está disponible en este momento. Inténtalo más tarde.`;

/**
 * Llama a Gemini en modo de salida estructurada: el modelo está
 * obligado a responder JSON conforme al schema, así que nunca se
 * parsea texto libre. Temperatura baja y sin presupuesto de
 * "thinking": salida estable y coste mínimo por llamada.
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
    const response = await gemini.models.generateContent({
      model: TEST_GENERATION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: testOutputJsonSchema,
        temperature: 0.2,
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
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new TestGenerationError(MODEL_UNAVAILABLE_ERROR);
      }
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
          "El modelo de IA está saturado en este momento. Inténtalo de nuevo en unos segundos.",
        );
      }
    }
    throw error;
  }
};
