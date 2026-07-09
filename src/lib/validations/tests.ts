import { z } from "zod";

import { TEST_DIFFICULTIES, TEST_QUESTION_COUNTS } from "@/constants/tests";

/** Parámetros con los que el usuario pide generar un test. */
export const generateTestSchema = z.object({
  documentId: z.uuid(),
  questionCount: z.literal(TEST_QUESTION_COUNTS, {
    error: "Elige 5, 10 o 20 preguntas",
  }),
  difficulty: z.enum(TEST_DIFFICULTIES, {
    error: "Elige una dificultad",
  }),
  topic: z
    .string()
    .trim()
    .min(3, "El tema debe tener al menos 3 caracteres")
    .max(200, "El tema no puede superar los 200 caracteres")
    .optional(),
});

export const testIdSchema = z.uuid();

export type GenerateTestInput = z.infer<typeof generateTestSchema>;
