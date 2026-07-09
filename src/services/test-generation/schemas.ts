import { z } from "zod";

/**
 * Forma exacta que debe devolver el modelo. La misma definición Zod
 * valida la respuesta y (vía z.toJSONSchema) se envía a Gemini como
 * responseJsonSchema, de modo que el contrato no puede divergir.
 */

export const QUESTION_OPTION_COUNT = 4;

export const generatedQuestionSchema = z.object({
  question: z.string().min(1),
  options: z
    .array(z.string().min(1))
    .length(QUESTION_OPTION_COUNT)
    .describe("Exactamente 4 opciones de respuesta, todas distintas"),
  correctAnswer: z
    .int()
    .min(0)
    .max(QUESTION_OPTION_COUNT - 1)
    .describe("Índice (0-3) de la única opción correcta"),
  explanation: z
    .string()
    .min(1)
    .describe("Por qué la opción correcta lo es, según el contexto"),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const generatedTestOutputSchema = z.object({
  insufficientContext: z
    .boolean()
    .describe(
      "true solo si el contexto no da para generar las preguntas pedidas",
    ),
  questions: z.array(generatedQuestionSchema),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedTestOutput = z.infer<typeof generatedTestOutputSchema>;

/** JSON Schema estándar para el modo de salida estructurada del SDK. */
export const testOutputJsonSchema = z.toJSONSchema(generatedTestOutputSchema);
