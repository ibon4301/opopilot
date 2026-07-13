import type { FlashcardDifficulty } from "@/constants/flashcards";

import { generatedDeckOutputSchema, type GeneratedDeckOutput } from "./schemas";

/**
 * Respuesta del modelo que no cumple el contrato. Es la única clase de
 * fallo que merece reintento: la petición era buena, la respuesta no.
 */
export class InvalidDeckOutputError extends Error {}

export interface ValidateDeckOutputParams {
  cardCount: number;
  difficulty: FlashcardDifficulty;
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Parsea y valida la respuesta cruda del modelo:
 * JSON válido → schema (front/back no vacíos, dificultad válida) →
 * número exacto de tarjetas → sin tarjetas duplicadas ni triviales
 * (front repetido, o front y back iguales). Si el usuario fijó una
 * dificultad, se normaliza la etiqueta de cada tarjeta a la pedida.
 */
export function parseGeneratedDeck(
  rawText: string,
  { cardCount, difficulty }: ValidateDeckOutputParams,
): GeneratedDeckOutput {
  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new InvalidDeckOutputError("La respuesta del modelo no es JSON.");
  }

  const parsed = generatedDeckOutputSchema.safeParse(json);
  if (!parsed.success) {
    throw new InvalidDeckOutputError(
      `La respuesta del modelo no cumple el schema: ${parsed.error.issues[0]?.message ?? "error desconocido"}`,
    );
  }

  const output = parsed.data;

  // Respuesta deliberada del modelo, no un fallo de formato: se
  // devuelve tal cual para que el servicio la convierta en error
  // controlado sin reintentar.
  if (output.insufficientContext) {
    return { insufficientContext: true, flashcards: [] };
  }

  if (output.flashcards.length !== cardCount) {
    throw new InvalidDeckOutputError(
      `Se pidieron ${cardCount} tarjetas y el modelo devolvió ${output.flashcards.length}.`,
    );
  }

  const seenFronts = new Set<string>();

  const flashcards = output.flashcards.map((card) => {
    const front = card.front.trim();
    const back = card.back.trim();
    const hint = card.hint?.trim() || null;

    if (front.length === 0 || back.length === 0) {
      throw new InvalidDeckOutputError(
        "Una tarjeta tiene el anverso o el reverso vacío.",
      );
    }
    if (normalizeText(front) === normalizeText(back)) {
      throw new InvalidDeckOutputError(
        "Una tarjeta tiene el mismo contenido en anverso y reverso.",
      );
    }
    if (seenFronts.has(normalizeText(front))) {
      throw new InvalidDeckOutputError("Hay tarjetas duplicadas en el mazo.");
    }
    seenFronts.add(normalizeText(front));

    return {
      ...card,
      front,
      back,
      hint,
      difficulty: difficulty === "mixed" ? card.difficulty : difficulty,
    };
  });

  return { insufficientContext: false, flashcards };
}
