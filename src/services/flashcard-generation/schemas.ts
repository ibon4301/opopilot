import { z } from "zod";

/**
 * Forma exacta que debe devolver el modelo. La misma definición Zod
 * valida la respuesta y (vía z.toJSONSchema) se envía a Gemini como
 * responseJsonSchema, de modo que el contrato no puede divergir.
 *
 * hint y sourcePage son obligatorios pero nullable: con salida
 * estructurada es más fiable exigir el campo siempre y admitir null
 * que dejarlo opcional.
 */

export const generatedFlashcardSchema = z.object({
  front: z
    .string()
    .min(1)
    .describe("Anverso: la pregunta o el concepto, autocontenido"),
  back: z
    .string()
    .min(1)
    .describe("Reverso: la respuesta o definición, concreta y sin ambigüedad"),
  hint: z
    .string()
    .nullable()
    .describe(
      "Pista breve que ayuda a recordar sin revelar la respuesta; null si no aporta nada",
    ),
  difficulty: z.enum(["easy", "medium", "hard"]),
  sourcePage: z
    .int()
    .min(1)
    .nullable()
    .describe(
      "Página del contexto de la que procede el contenido; null si no consta",
    ),
});

export const generatedDeckOutputSchema = z.object({
  insufficientContext: z
    .boolean()
    .describe(
      "true solo si el contexto no da para generar las tarjetas pedidas",
    ),
  flashcards: z.array(generatedFlashcardSchema),
});

export type GeneratedFlashcard = z.infer<typeof generatedFlashcardSchema>;
export type GeneratedDeckOutput = z.infer<typeof generatedDeckOutputSchema>;

/** JSON Schema estándar para el modo de salida estructurada del SDK. */
export const deckOutputJsonSchema = z.toJSONSchema(generatedDeckOutputSchema);
