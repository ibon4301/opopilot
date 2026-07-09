import type { SupabaseClient } from "@supabase/supabase-js";

import type { TestDifficulty } from "@/constants/tests";
import type { Database } from "@/lib/supabase/types";
import type { GenerateTestInput } from "@/lib/validations/tests";
import { type EmbedFn } from "@/services/embeddings/embedding-client";
import { embedTexts } from "@/services/embeddings/gemini-embeddings";

import { generateQuestionsWithGemini } from "./gemini-test-provider";
import { buildTestGenerationPrompt } from "./prompts";
import { TestGenerationError, type GenerateQuestionsFn } from "./provider";
import type { GeneratedQuestion } from "./schemas";
import { InvalidTestOutputError, parseGeneratedTest } from "./validators";

/**
 * Presupuesto de contexto (en chunks de ~275 tokens). Nunca se envía el
 * documento entero: por tema se recuperan los top-k relevantes vía RPC
 * y por documento completo se muestrea uniformemente a lo largo de él.
 */
const TOPIC_CONTEXT_CHUNKS = 12;
const FULL_DOCUMENT_CONTEXT_CHUNKS = 24;

/** Por debajo de esta similitud, el tema no está en el documento. */
const TOPIC_MIN_SIMILARITY = 0.35;

/** Un solo reintento cuando el modelo devuelve una respuesta inválida. */
const MAX_GENERATION_ATTEMPTS = 2;

const INSUFFICIENT_CONTEXT_ERROR =
  "El documento no contiene información suficiente para generar este test. Prueba con otro tema o con menos preguntas.";

type Supabase = SupabaseClient<Database>;

interface ContextChunk {
  id: string;
  content: string;
  pageNumber: number | null;
}

export interface GenerateTestParams {
  /** Cliente en contexto del usuario: RLS decide qué puede leer y escribir. */
  supabase: Supabase;
  userId: string;
  input: GenerateTestInput;
  /** Inyectables para tests; por defecto, Gemini. */
  generateQuestions?: GenerateQuestionsFn;
  embed?: EmbedFn;
}

export interface GeneratedTestSummary {
  testId: string;
  questionCount: number;
}

/**
 * Orquesta la generación completa de un test: recuperación del
 * contexto → prompt → modelo (con un reintento) → validación →
 * persistencia (test + preguntas + chunks de contexto).
 */
export async function generateTest({
  supabase,
  userId,
  input,
  generateQuestions = generateQuestionsWithGemini,
  embed = embedTexts,
}: GenerateTestParams): Promise<GeneratedTestSummary> {
  const document = await getGenerableDocument(supabase, input.documentId);
  const topic = input.topic ?? null;

  const contextChunks = topic
    ? await getTopicContext(supabase, embed, document.id, topic)
    : await getFullDocumentContext(supabase, document.id);

  const prompt = buildTestGenerationPrompt({
    documentName: document.filename,
    topic,
    contextChunks: contextChunks.map((chunk) => ({
      content: chunk.content,
      pageNumber: chunk.pageNumber,
    })),
    questionCount: input.questionCount,
    difficulty: input.difficulty,
  });

  const questions = await generateValidQuestions(
    generateQuestions,
    prompt,
    input,
  );

  return persistTest({
    supabase,
    userId,
    input,
    documentFilename: document.filename,
    questions,
    contextChunkIds: contextChunks.map((chunk) => chunk.id),
  });
}

// ------------------------------------------------------------
// Recuperación del contexto
// ------------------------------------------------------------

async function getGenerableDocument(supabase: Supabase, documentId: string) {
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, filename, status")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!document) {
    throw new TestGenerationError("El documento no existe.");
  }
  if (document.status !== "embedded") {
    throw new TestGenerationError(
      "El documento aún no está indexado. Procésalo y genera sus embeddings antes de crear tests.",
    );
  }
  return document;
}

/**
 * Tema concreto: embedding de la consulta (los de los chunks ya
 * existen y nunca se recalculan) + top-k por similitud dentro del
 * documento vía la RPC match_document_chunks.
 */
async function getTopicContext(
  supabase: Supabase,
  embed: EmbedFn,
  documentId: string,
  topic: string,
): Promise<ContextChunk[]> {
  const [queryEmbedding] = await embed([topic], "query");

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: TOPIC_CONTEXT_CHUNKS,
    filter_document_id: documentId,
  });

  if (error) {
    throw error;
  }

  const relevant = data.filter(
    (match) => match.similarity >= TOPIC_MIN_SIMILARITY,
  );
  if (relevant.length === 0) {
    throw new TestGenerationError(
      "No se ha encontrado contenido sobre ese tema en el documento. Prueba a formularlo de otra manera.",
    );
  }

  return relevant.map((match) => ({
    id: match.chunk_id,
    content: match.content,
    pageNumber: match.page_number,
  }));
}

/**
 * Documento completo: muestreo uniforme de chunks a lo largo del
 * documento. Cubre todo el temario con un presupuesto fijo de tokens y
 * sin ninguna llamada extra al proveedor de embeddings.
 */
async function getFullDocumentContext(
  supabase: Supabase,
  documentId: string,
): Promise<ContextChunk[]> {
  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id, content, page_number")
    .eq("document_id", documentId)
    .order("chunk_index");

  if (error) {
    throw error;
  }
  if (chunks.length === 0) {
    throw new TestGenerationError(
      "El documento no tiene fragmentos. Procésalo primero.",
    );
  }

  return sampleEvenly(chunks, FULL_DOCUMENT_CONTEXT_CHUNKS).map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    pageNumber: chunk.page_number,
  }));
}

function sampleEvenly<T>(items: T[], max: number): T[] {
  if (items.length <= max) {
    return items;
  }
  const step = items.length / max;
  const sampled: T[] = [];
  for (let index = 0; index < max; index++) {
    const item = items[Math.floor(index * step)];
    if (item !== undefined) {
      sampled.push(item);
    }
  }
  return sampled;
}

// ------------------------------------------------------------
// Modelo + validación (con un único reintento)
// ------------------------------------------------------------

async function generateValidQuestions(
  generateQuestions: GenerateQuestionsFn,
  prompt: string,
  input: GenerateTestInput,
): Promise<GeneratedQuestion[]> {
  let lastError: InvalidTestOutputError | null = null;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const rawText = await generateQuestions(prompt);

    try {
      const output = parseGeneratedTest(rawText, {
        questionCount: input.questionCount,
        difficulty: input.difficulty,
      });

      // Decisión deliberada del modelo (no un fallo de formato): el
      // contexto no da para el test pedido. No se reintenta.
      if (output.insufficientContext) {
        throw new TestGenerationError(INSUFFICIENT_CONTEXT_ERROR);
      }

      return output.questions;
    } catch (error) {
      if (error instanceof InvalidTestOutputError) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw new TestGenerationError(
    "La IA no ha devuelto un test válido tras dos intentos. Inténtalo de nuevo.",
    { cause: lastError ?? undefined },
  );
}

// ------------------------------------------------------------
// Persistencia
// ------------------------------------------------------------

async function persistTest({
  supabase,
  userId,
  input,
  documentFilename,
  questions,
  contextChunkIds,
}: {
  supabase: Supabase;
  userId: string;
  input: GenerateTestInput;
  documentFilename: string;
  questions: GeneratedQuestion[];
  contextChunkIds: string[];
}): Promise<GeneratedTestSummary> {
  const topic = input.topic ?? null;
  const title = (topic ?? `Test de ${documentFilename}`).slice(0, 200);

  const { data: test, error: testError } = await supabase
    .from("tests")
    .insert({
      user_id: userId,
      document_id: input.documentId,
      title,
      topic,
      status: "ready",
      difficulty: toStoredDifficulty(input.difficulty),
      question_count: questions.length,
    })
    .select("id")
    .single();

  if (testError) {
    throw testError;
  }

  const { error: questionsError } = await supabase.from("questions").insert(
    questions.map((question, index) => ({
      test_id: test.id,
      user_id: userId,
      order_index: index,
      statement: question.question,
      options: question.options,
      correct_option: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
    })),
  );

  const { error: contextError } = questionsError
    ? { error: questionsError }
    : await supabase.from("test_context_chunks").insert(
        contextChunkIds.map((chunkId) => ({
          test_id: test.id,
          chunk_id: chunkId,
          user_id: userId,
        })),
      );

  if (questionsError || contextError) {
    // Sin transacciones entre peticiones PostgREST: se limpia el test a
    // medias (las preguntas/contexto ya insertados caen en cascada).
    await supabase.from("tests").delete().eq("id", test.id);
    throw questionsError ?? contextError;
  }

  return { testId: test.id, questionCount: questions.length };
}

/** "mixed" no existe en el enum de la base de datos: se guarda como null. */
function toStoredDifficulty(difficulty: TestDifficulty) {
  return difficulty === "mixed" ? null : difficulty;
}
