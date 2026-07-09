import type { TestDifficulty } from "@/constants/tests";

export interface PromptContextChunk {
  content: string;
  pageNumber: number | null;
}

export interface BuildTestPromptParams {
  documentName: string;
  /** null = test sobre el documento completo. */
  topic: string | null;
  contextChunks: readonly PromptContextChunk[];
  questionCount: number;
  difficulty: TestDifficulty;
}

const DIFFICULTY_INSTRUCTION: Record<TestDifficulty, string> = {
  easy: 'Todas las preguntas de dificultad "easy": datos directos del contexto.',
  medium:
    'Todas las preguntas de dificultad "medium": exigen comprender el contexto, no solo localizar un dato.',
  hard: 'Todas las preguntas de dificultad "hard": matices, excepciones y relaciones entre partes del contexto.',
  mixed:
    "Mezcla dificultades: aproximadamente un tercio easy, un tercio medium y un tercio hard.",
};

/**
 * Prompt compacto: el contexto son los chunks ya recuperados (nunca el
 * documento entero) y las reglas de formato las impone el JSON Schema
 * de salida estructurada, así que aquí solo van las reglas de contenido.
 */
export function buildTestGenerationPrompt({
  documentName,
  topic,
  contextChunks,
  questionCount,
  difficulty,
}: BuildTestPromptParams): string {
  const context = contextChunks
    .map(
      (chunk, index) =>
        `[${index + 1}]${chunk.pageNumber ? ` (pág. ${chunk.pageNumber})` : ""} ${chunk.content}`,
    )
    .join("\n\n");

  return `Eres un generador de preguntas tipo test para personas que preparan oposiciones en España.

DOCUMENTO: «${documentName}»
ALCANCE: ${topic ? `el tema «${topic}»` : "el documento completo"}

CONTEXTO (fragmentos del documento; tu ÚNICA fuente de información):
${context}

INSTRUCCIONES:
- Genera exactamente ${questionCount} preguntas tipo test en español.
- Usa exclusivamente la información del CONTEXTO. No aportes conocimiento externo ni inventes datos, cifras o nombres.
- ${DIFFICULTY_INSTRUCTION[difficulty]}
- Cada pregunta tiene exactamente 4 opciones distintas y plausibles, con una única correcta (correctAnswer es su índice, de 0 a 3). Varía la posición de la correcta.
- explanation justifica brevemente la respuesta correcta citando la idea del contexto en la que se apoya.
- difficulty refleja la dificultad real de cada pregunta (easy | medium | hard).
- Si el CONTEXTO no contiene información suficiente para generar ${questionCount} preguntas rigurosas${topic ? " sobre ese tema" : ""}, devuelve insufficientContext=true y questions=[]. Nunca rellenes con contenido inventado.`;
}
