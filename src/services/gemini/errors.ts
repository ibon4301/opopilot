import { ApiError } from "@google/genai";

export interface DescribeGeminiApiErrorOptions {
  /** Mensaje para un 404 del modelo; sin él, el 404 no se traduce. */
  modelUnavailableMessage?: string;
}

/**
 * Traduce los errores comunes de la API de Gemini a mensajes amigables
 * compartidos por todos los proveedores (embeddings, tests,
 * flashcards…). Devuelve null si el error no es un caso conocido: el
 * llamador debe relanzarlo tal cual.
 */
export function describeGeminiApiError(
  error: unknown,
  { modelUnavailableMessage }: DescribeGeminiApiErrorOptions = {},
): string | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  if (error.status === 404 && modelUnavailableMessage) {
    return modelUnavailableMessage;
  }

  const invalidKey =
    error.status === 401 ||
    error.status === 403 ||
    (error.status === 400 && error.message.includes("API key"));
  if (invalidKey) {
    return "La API key de Gemini no es válida. Revisa GEMINI_API_KEY en .env.";
  }

  if (error.status === 429) {
    return "Gemini está limitando las peticiones (capa gratuita). Espera un minuto y vuelve a intentarlo.";
  }

  if (error.status === 503) {
    return "El modelo de IA está saturado en este momento. Inténtalo de nuevo en unos segundos.";
  }

  return null;
}
