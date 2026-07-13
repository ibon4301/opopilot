import type { SupabaseClient } from "@supabase/supabase-js";

import type { FlashcardDifficulty } from "@/constants/flashcards";
import type { Database } from "@/lib/supabase/types";
import type { GenerateDeckInput } from "@/lib/validations/flashcards";
import {
  getFullDocumentContext,
  getGenerableDocument,
  getTopicContext,
  type ContextChunk,
} from "@/services/document-context/document-context";
import { type EmbedFn } from "@/services/embeddings/embedding-client";
import { embedTexts } from "@/services/embeddings/gemini-embeddings";

import { generateFlashcardsWithGemini } from "./gemini-flashcard-provider";
import { buildFlashcardGenerationPrompt } from "./prompts";
import {
  FlashcardGenerationError,
  type GenerateFlashcardsFn,
} from "./provider";
import type { GeneratedFlashcard } from "./schemas";
import { InvalidDeckOutputError, parseGeneratedDeck } from "./validators";

/**
 * Presupuesto de contexto (en chunks de ~275 tokens), igual que en la
 * generación de tests: nunca se envía el documento entero.
 */
const TOPIC_CONTEXT_CHUNKS = 12;
const FULL_DOCUMENT_CONTEXT_CHUNKS = 24;

/** Un solo reintento cuando el modelo devuelve una respuesta inválida. */
const MAX_GENERATION_ATTEMPTS = 2;

const INSUFFICIENT_CONTEXT_ERROR =
  "El documento no contiene información suficiente para generar este mazo. Prueba con otro tema o con menos tarjetas.";

type Supabase = SupabaseClient<Database>;

export interface GenerateDeckParams {
  /** Cliente en contexto del usuario: RLS decide qué puede leer y escribir. */
  supabase: Supabase;
  userId: string;
  input: GenerateDeckInput;
  /** Inyectables para tests; por defecto, Gemini. */
  generateFlashcards?: GenerateFlashcardsFn;
  embed?: EmbedFn;
}

export interface GeneratedDeckSummary {
  deckId: string;
  cardCount: number;
}

/**
 * Orquesta la generación completa de un mazo: recuperación del
 * contexto → prompt → modelo (con un reintento) → validación →
 * persistencia (mazo + tarjetas + chunks de contexto).
 */
export async function generateFlashcardDeck({
  supabase,
  userId,
  input,
  generateFlashcards = generateFlashcardsWithGemini,
  embed = embedTexts,
}: GenerateDeckParams): Promise<GeneratedDeckSummary> {
  const document = await getGenerableDocument(supabase, input.documentId);
  const topic = input.topic ?? null;

  const contextChunks = topic
    ? await getTopicContext({
        supabase,
        embed,
        documentId: document.id,
        topic,
        maxChunks: TOPIC_CONTEXT_CHUNKS,
      })
    : await getFullDocumentContext({
        supabase,
        documentId: document.id,
        maxChunks: FULL_DOCUMENT_CONTEXT_CHUNKS,
      });

  const prompt = buildFlashcardGenerationPrompt({
    documentName: document.filename,
    topic,
    contextChunks: contextChunks.map((chunk) => ({
      content: chunk.content,
      pageNumber: chunk.pageNumber,
    })),
    cardCount: input.cardCount,
    difficulty: input.difficulty,
    cardType: input.cardType,
  });

  const flashcards = await generateValidFlashcards(
    generateFlashcards,
    prompt,
    input,
  );

  return persistDeck({
    supabase,
    userId,
    input,
    documentFilename: document.filename,
    flashcards: sanitizeSourcePages(flashcards, contextChunks),
    contextChunkIds: contextChunks.map((chunk) => chunk.id),
  });
}

// ------------------------------------------------------------
// Modelo + validación (con un único reintento)
// ------------------------------------------------------------

async function generateValidFlashcards(
  generateFlashcards: GenerateFlashcardsFn,
  prompt: string,
  input: GenerateDeckInput,
): Promise<GeneratedFlashcard[]> {
  let lastError: InvalidDeckOutputError | null = null;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const rawText = await generateFlashcards(prompt);

    try {
      const output = parseGeneratedDeck(rawText, {
        cardCount: input.cardCount,
        difficulty: input.difficulty,
      });

      // Decisión deliberada del modelo (no un fallo de formato): el
      // contexto no da para el mazo pedido. No se reintenta.
      if (output.insufficientContext) {
        throw new FlashcardGenerationError(INSUFFICIENT_CONTEXT_ERROR);
      }

      return output.flashcards;
    } catch (error) {
      if (error instanceof InvalidDeckOutputError) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw new FlashcardGenerationError(
    "La IA no ha devuelto un mazo válido tras dos intentos. Inténtalo de nuevo.",
    { cause: lastError ?? undefined },
  );
}

/**
 * sourcePage debe proceder de los chunks realmente usados: cualquier
 * página que el modelo cite y no esté en el contexto se descarta a null.
 */
function sanitizeSourcePages(
  flashcards: GeneratedFlashcard[],
  contextChunks: readonly ContextChunk[],
): GeneratedFlashcard[] {
  const contextPages = new Set(
    contextChunks
      .map((chunk) => chunk.pageNumber)
      .filter((page): page is number => page !== null),
  );

  return flashcards.map((card) => ({
    ...card,
    sourcePage:
      card.sourcePage !== null && contextPages.has(card.sourcePage)
        ? card.sourcePage
        : null,
  }));
}

// ------------------------------------------------------------
// Persistencia
// ------------------------------------------------------------

async function persistDeck({
  supabase,
  userId,
  input,
  documentFilename,
  flashcards,
  contextChunkIds,
}: {
  supabase: Supabase;
  userId: string;
  input: GenerateDeckInput;
  documentFilename: string;
  flashcards: GeneratedFlashcard[];
  contextChunkIds: string[];
}): Promise<GeneratedDeckSummary> {
  const topic = input.topic ?? null;
  const title = (topic ?? `Flashcards de ${documentFilename}`).slice(0, 200);

  const { data: deck, error: deckError } = await supabase
    .from("flashcard_decks")
    .insert({
      user_id: userId,
      document_id: input.documentId,
      title,
      topic,
      difficulty: toStoredDifficulty(input.difficulty),
      card_count: flashcards.length,
    })
    .select("id")
    .single();

  if (deckError) {
    throw deckError;
  }

  const { error: cardsError } = await supabase.from("flashcards").insert(
    flashcards.map((card, index) => ({
      deck_id: deck.id,
      user_id: userId,
      document_id: input.documentId,
      order_index: index,
      front: card.front,
      back: card.back,
      hint: card.hint,
      difficulty: card.difficulty,
      source_page: card.sourcePage,
    })),
  );

  const { error: contextError } = cardsError
    ? { error: cardsError }
    : await supabase.from("flashcard_deck_context_chunks").insert(
        contextChunkIds.map((chunkId) => ({
          deck_id: deck.id,
          chunk_id: chunkId,
          user_id: userId,
        })),
      );

  if (cardsError || contextError) {
    // Sin transacciones entre peticiones PostgREST: se limpia el mazo a
    // medias (las tarjetas/contexto ya insertados caen en cascada).
    await supabase.from("flashcard_decks").delete().eq("id", deck.id);
    throw cardsError ?? contextError;
  }

  return { deckId: deck.id, cardCount: flashcards.length };
}

/** "mixed" no existe en el enum de la base de datos: se guarda como null. */
function toStoredDifficulty(difficulty: FlashcardDifficulty) {
  return difficulty === "mixed" ? null : difficulty;
}
