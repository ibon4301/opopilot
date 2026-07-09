import { estimateTokens } from "@/utils/tokens";

/**
 * Chunking jerárquico con contexto: acumula párrafos completos hasta el
 * tamaño objetivo; un párrafo que no cabe se divide por frases y solo se
 * corta una frase por palabras como último recurso. Cada chunk arranca
 * con las últimas frases del anterior (solape) para no perder contexto
 * en los cortes.
 *
 * Tamaños pensados para embeddings (Fase 6): ~1100 caracteres ≈ 275
 * tokens por chunk, muy por debajo del límite de los modelos de
 * embeddings y suficientemente granular para recuperación RAG.
 */
const CHUNK_TARGET_CHARS = 1100;
const CHUNK_MAX_CHARS = 1600;
const CHUNK_OVERLAP_CHARS = 200;
const CHUNK_MIN_CHARS = 25;

export interface PageText {
  pageNumber: number;
  text: string;
}

export interface TextChunk {
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
}

interface Unit {
  pageNumber: number;
  text: string;
}

/** Divide en frases respetando la puntuación del español. */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+(?=[¿¡"«(A-ZÁÉÍÓÚÜÑ0-9])/)
    .filter((sentence) => sentence.trim().length > 0);
}

/** Corte duro por palabras, solo para frases más largas que CHUNK_MAX_CHARS. */
function splitByWords(text: string): string[] {
  const parts: string[] = [];
  let remaining = text.trim();

  while (remaining.length > CHUNK_MAX_CHARS) {
    const cut = remaining.lastIndexOf(" ", CHUNK_MAX_CHARS);
    const at = cut > CHUNK_MAX_CHARS / 2 ? cut : CHUNK_MAX_CHARS;
    parts.push(remaining.slice(0, at).trim());
    remaining = remaining.slice(at).trim();
  }
  if (remaining.length > 0) {
    parts.push(remaining);
  }
  return parts;
}

/** Párrafos → unidades que siempre caben en un chunk (frases o trozos). */
function toUnits(pages: PageText[]): Unit[] {
  const units: Unit[] = [];

  for (const page of pages) {
    for (const paragraph of page.text.split(/\n{2,}/)) {
      const trimmed = paragraph.replace(/\s+/g, " ").trim();
      if (trimmed.length === 0) continue;

      if (trimmed.length <= CHUNK_MAX_CHARS) {
        units.push({ pageNumber: page.pageNumber, text: trimmed });
        continue;
      }

      for (const sentence of splitIntoSentences(trimmed)) {
        for (const piece of sentence.length > CHUNK_MAX_CHARS
          ? splitByWords(sentence)
          : [sentence]) {
          units.push({ pageNumber: page.pageNumber, text: piece });
        }
      }
    }
  }

  return units;
}

/** Últimas frases del chunk, hasta CHUNK_OVERLAP_CHARS, para solapar. */
function overlapTail(content: string): string {
  const sentences = splitIntoSentences(content);
  let tail = "";

  for (let i = sentences.length - 1; i >= 0; i--) {
    const candidate = tail.length
      ? `${sentences[i]} ${tail}`
      : (sentences[i] ?? "");
    if (candidate.length > CHUNK_OVERLAP_CHARS) break;
    tail = candidate;
  }

  return tail;
}

export function chunkPages(pages: PageText[]): TextChunk[] {
  const units = toUnits(pages);
  const chunks: TextChunk[] = [];

  let buffer: string[] = [];
  let bufferLength = 0;
  let pageNumber: number | null = null;

  function emit() {
    const content = buffer.join("\n\n").trim();
    buffer = [];
    bufferLength = 0;

    if (content.length < CHUNK_MIN_CHARS) return;

    chunks.push({
      chunkIndex: chunks.length,
      pageNumber: pageNumber ?? 1,
      content,
      tokenCount: estimateTokens(content),
    });

    // El siguiente chunk arranca con la cola del actual como contexto.
    const tail = overlapTail(content);
    if (tail.length > 0) {
      buffer = [tail];
      bufferLength = tail.length;
    }
    pageNumber = null;
  }

  for (const unit of units) {
    if (
      bufferLength > 0 &&
      bufferLength + unit.text.length > CHUNK_TARGET_CHARS
    ) {
      emit();
    }
    // La página del chunk es la de su primera unidad real (no el solape).
    pageNumber ??= unit.pageNumber;
    buffer.push(unit.text);
    bufferLength += unit.text.length + 2;
  }

  // pageNumber === null ⇒ el buffer solo contiene el solape ya emitido.
  if (pageNumber !== null) {
    emit();
  }

  return chunks;
}
