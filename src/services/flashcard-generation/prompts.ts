import type {
  FlashcardDifficulty,
  FlashcardType,
} from "@/constants/flashcards";

export interface PromptContextChunk {
  content: string;
  pageNumber: number | null;
}

export interface BuildFlashcardPromptParams {
  documentName: string;
  /** null = mazo sobre el documento completo. */
  topic: string | null;
  contextChunks: readonly PromptContextChunk[];
  cardCount: number;
  difficulty: FlashcardDifficulty;
  cardType: FlashcardType;
}

const DIFFICULTY_INSTRUCTION: Record<FlashcardDifficulty, string> = {
  easy: 'Todas las tarjetas de dificultad "easy": datos directos del contexto.',
  medium:
    'Todas las tarjetas de dificultad "medium": exigen comprender el contexto, no solo memorizar un dato.',
  hard: 'Todas las tarjetas de dificultad "hard": matices, excepciones y relaciones entre partes del contexto.',
  mixed:
    "Mezcla dificultades: aproximadamente un tercio easy, un tercio medium y un tercio hard.",
};

const TYPE_INSTRUCTION: Record<FlashcardType, string> = {
  qa: "Todas las tarjetas de tipo pregunta y respuesta: front es una pregunta concreta y back la responde.",
  concept:
    "Todas las tarjetas de tipo concepto y definición: front es un término o concepto del contexto y back lo define.",
  mixed:
    "Mezcla tarjetas de pregunta-respuesta y de concepto-definición, según lo que mejor encaje con cada contenido.",
};

/**
 * Prompt compacto: el contexto son los chunks ya recuperados (nunca el
 * documento entero) y las reglas de formato las impone el JSON Schema
 * de salida estructurada, así que aquí solo van las reglas de contenido.
 */
export function buildFlashcardGenerationPrompt({
  documentName,
  topic,
  contextChunks,
  cardCount,
  difficulty,
  cardType,
}: BuildFlashcardPromptParams): string {
  const context = contextChunks
    .map(
      (chunk, index) =>
        `[${index + 1}]${chunk.pageNumber ? ` (pág. ${chunk.pageNumber})` : ""} ${chunk.content}`,
    )
    .join("\n\n");

  return `Eres un generador de flashcards de estudio para personas que preparan oposiciones en España.

DOCUMENTO: «${documentName}»
ALCANCE: ${topic ? `el tema «${topic}»` : "el documento completo"}

CONTEXTO (fragmentos del documento; tu ÚNICA fuente de información):
${context}

INSTRUCCIONES:
- Genera exactamente ${cardCount} flashcards en español.
- Usa exclusivamente la información del CONTEXTO. No aportes conocimiento externo ni inventes datos, cifras o nombres.
- ${TYPE_INSTRUCTION[cardType]}
- ${DIFFICULTY_INSTRUCTION[difficulty]}
- back debe ser concreto y sin ambigüedad: una única respuesta correcta que se pueda autoevaluar de un vistazo.
- No repitas tarjetas ni generes tarjetas casi iguales: cada una debe cubrir una idea distinta del contexto.
- No generes tarjetas cuya respuesta dependa de una imagen, tabla o figura que no esté en el CONTEXTO.
- hint es opcional: una pista breve que oriente sin revelar la respuesta; usa null si no aporta.
- sourcePage es el número de página indicado en el fragmento del que procede la tarjeta; usa null si el fragmento no lo indica.
- difficulty refleja la dificultad real de cada tarjeta (easy | medium | hard).
- Si el CONTEXTO no contiene información suficiente para generar ${cardCount} tarjetas rigurosas${topic ? " sobre ese tema" : ""}, devuelve insufficientContext=true y flashcards=[]. Nunca rellenes con contenido inventado.`;
}
