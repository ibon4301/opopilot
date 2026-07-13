import type { Enums } from "@/lib/supabase/types";

/** Tamaños de mazo que puede pedir el usuario. */
export const FLASHCARD_COUNTS = [10, 20, 30] as const;

export type FlashcardCount = (typeof FLASHCARD_COUNTS)[number];

/** Dificultad solicitada; "mixed" se guarda como difficulty = null. */
export const FLASHCARD_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
  "mixed",
] as const;

export type FlashcardDifficulty = (typeof FLASHCARD_DIFFICULTIES)[number];

export const FLASHCARD_DIFFICULTY_LABELS: Record<FlashcardDifficulty, string> =
  {
    easy: "Fácil",
    medium: "Media",
    hard: "Difícil",
    mixed: "Mixta",
  };

/** Tipo de tarjeta a generar; solo afecta al prompt, no se persiste. */
export const FLASHCARD_TYPES = ["qa", "concept", "mixed"] as const;

export type FlashcardType = (typeof FLASHCARD_TYPES)[number];

export const FLASHCARD_TYPE_LABELS: Record<FlashcardType, string> = {
  qa: "Pregunta y respuesta",
  concept: "Concepto y definición",
  mixed: "Mixto",
};

/** Valoraciones de estudio, de peor a mejor recuerdo. */
export const FLASHCARD_RATINGS = [
  "again",
  "hard",
  "good",
  "easy",
] as const satisfies readonly Enums<"flashcard_rating">[];

export type FlashcardRating = Enums<"flashcard_rating">;

export const FLASHCARD_RATING_LABELS: Record<FlashcardRating, string> = {
  again: "No la sabía",
  hard: "Difícil",
  good: "Bien",
  easy: "Fácil",
};
