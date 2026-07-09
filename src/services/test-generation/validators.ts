import type { TestDifficulty } from "@/constants/tests";

import { generatedTestOutputSchema, type GeneratedTestOutput } from "./schemas";

/**
 * Respuesta del modelo que no cumple el contrato. Es la única clase de
 * fallo que merece reintento: la petición era buena, la respuesta no.
 */
export class InvalidTestOutputError extends Error {}

export interface ValidateTestOutputParams {
  questionCount: number;
  difficulty: TestDifficulty;
}

function normalizeOption(option: string): string {
  return option.trim().toLowerCase();
}

/**
 * Parsea y valida la respuesta cruda del modelo:
 * JSON válido → schema (4 opciones, correctAnswer 0-3, explicación y
 * pregunta no vacías) → número exacto de preguntas → opciones distintas
 * entre sí. Si el usuario fijó una dificultad, se normaliza la etiqueta
 * de cada pregunta a la pedida.
 */
export function parseGeneratedTest(
  rawText: string,
  { questionCount, difficulty }: ValidateTestOutputParams,
): GeneratedTestOutput {
  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new InvalidTestOutputError("La respuesta del modelo no es JSON.");
  }

  const parsed = generatedTestOutputSchema.safeParse(json);
  if (!parsed.success) {
    throw new InvalidTestOutputError(
      `La respuesta del modelo no cumple el schema: ${parsed.error.issues[0]?.message ?? "error desconocido"}`,
    );
  }

  const output = parsed.data;

  // Respuesta deliberada del modelo, no un fallo de formato: se
  // devuelve tal cual para que el servicio la convierta en error
  // controlado sin reintentar.
  if (output.insufficientContext) {
    return { insufficientContext: true, questions: [] };
  }

  if (output.questions.length !== questionCount) {
    throw new InvalidTestOutputError(
      `Se pidieron ${questionCount} preguntas y el modelo devolvió ${output.questions.length}.`,
    );
  }

  const questions = output.questions.map((question) => {
    const options = question.options.map((option) => option.trim());
    if (options.some((option) => option.length === 0)) {
      throw new InvalidTestOutputError("Una pregunta tiene opciones vacías.");
    }
    if (new Set(options.map(normalizeOption)).size !== options.length) {
      throw new InvalidTestOutputError(
        "Una pregunta tiene opciones repetidas.",
      );
    }
    if (question.question.trim().length === 0) {
      throw new InvalidTestOutputError("Una pregunta está vacía.");
    }
    if (question.explanation.trim().length === 0) {
      throw new InvalidTestOutputError("Una pregunta no tiene explicación.");
    }

    return {
      ...question,
      question: question.question.trim(),
      options,
      explanation: question.explanation.trim(),
      difficulty: difficulty === "mixed" ? question.difficulty : difficulty,
    };
  });

  return { insufficientContext: false, questions };
}
