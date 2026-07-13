import { z } from "zod";

import {
  FLASHCARD_COUNTS,
  FLASHCARD_DIFFICULTIES,
  FLASHCARD_RATINGS,
  FLASHCARD_TYPES,
} from "@/constants/flashcards";

/** Parámetros con los que el usuario pide generar un mazo. */
export const generateDeckSchema = z.object({
  documentId: z.uuid(),
  cardCount: z.literal(FLASHCARD_COUNTS, {
    error: "Elige 10, 20 o 30 tarjetas",
  }),
  difficulty: z.enum(FLASHCARD_DIFFICULTIES, {
    error: "Elige una dificultad",
  }),
  cardType: z.enum(FLASHCARD_TYPES, {
    error: "Elige un tipo de tarjeta",
  }),
  topic: z
    .string()
    .trim()
    .min(3, "El tema debe tener al menos 3 caracteres")
    .max(200, "El tema no puede superar los 200 caracteres")
    .optional(),
});

export const deckIdSchema = z.uuid();

/** Valoración de una tarjeta durante una sesión de estudio. */
export const reviewFlashcardSchema = z.object({
  flashcardId: z.uuid(),
  rating: z.enum(FLASHCARD_RATINGS, { error: "Valoración no válida" }),
});

export type GenerateDeckInput = z.infer<typeof generateDeckSchema>;
export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardSchema>;
