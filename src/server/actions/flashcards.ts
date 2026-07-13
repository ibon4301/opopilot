"use server";

import { revalidatePath } from "next/cache";

import {
  GENERIC_ACTION_ERROR,
  SESSION_EXPIRED_ERROR,
} from "@/constants/errors";
import { ROUTES } from "@/constants/routes";
import { logActionError } from "@/lib/log";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import {
  deckIdSchema,
  generateDeckSchema,
  reviewFlashcardSchema,
  type GenerateDeckInput,
  type ReviewFlashcardInput,
} from "@/lib/validations/flashcards";
import { DocumentContextError } from "@/services/document-context/document-context";
import { EmbeddingError } from "@/services/embeddings/embedding-client";
import {
  generateFlashcardDeck,
  type GeneratedDeckSummary,
} from "@/services/flashcard-generation/flashcard-generation-service";
import { FlashcardGenerationError } from "@/services/flashcard-generation/provider";
import type { ActionResult } from "@/types";

export type FlashcardDeckListItem = Tables<"flashcard_decks"> & {
  documents: Pick<Tables<"documents">, "filename"> | null;
};

export type FlashcardDeckDetail = FlashcardDeckListItem & {
  flashcards: Tables<"flashcards">[];
};

function toFriendlyError(error: unknown): string {
  return error instanceof FlashcardGenerationError ||
    error instanceof DocumentContextError ||
    error instanceof EmbeddingError
    ? error.message
    : "No se pudo generar el mazo. Inténtalo de nuevo.";
}

/**
 * Genera un mazo de flashcards con IA a partir de un documento indexado
 * y lo guarda. El trabajo pesado (contexto → Gemini → validación →
 * persistencia) vive en services/flashcard-generation; aquí solo auth,
 * validación de entrada y traducción de errores.
 */
export async function generateFlashcardDeckAction(
  input: GenerateDeckInput,
): Promise<ActionResult<GeneratedDeckSummary>> {
  const parsed = generateDeckSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_ACTION_ERROR,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const supabase = await createClient();

  try {
    const result = await generateFlashcardDeck({
      supabase,
      userId: user.id,
      input: parsed.data,
    });
    revalidatePath(ROUTES.flashcards);
    return { success: true, data: result };
  } catch (error) {
    logActionError("flashcards.generate", error);
    return { success: false, error: toFriendlyError(error) };
  }
}

/** Mazos del usuario (RLS), más recientes primero. */
export async function listFlashcardDecksAction(): Promise<
  ActionResult<FlashcardDeckListItem[]>
> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flashcard_decks")
    .select("*, documents(filename)")
    .order("created_at", { ascending: false });

  if (error) {
    logActionError("flashcards.list", error);
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  return { success: true, data };
}

/**
 * Un mazo con sus tarjetas ordenadas, listo para estudiarse; RLS
 * limita al dueño. A diferencia de los tests, aquí el reverso sí viaja
 * completo: las flashcards son autoevaluación del propio usuario, así
 * que ocultarlo en el servidor solo añadiría una petición por tarjeta
 * sin proteger nada (la UI no lo renderiza hasta revelar).
 */
export async function getFlashcardDeckAction(
  deckId: string,
): Promise<ActionResult<FlashcardDeckDetail>> {
  const parsedId = deckIdSchema.safeParse(deckId);
  if (!parsedId.success) {
    return { success: false, error: "El mazo no existe." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flashcard_decks")
    .select("*, documents(filename), flashcards(*)")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    logActionError("flashcards.get", error);
    return { success: false, error: GENERIC_ACTION_ERROR };
  }
  if (!data) {
    return { success: false, error: "El mazo no existe." };
  }

  return {
    success: true,
    data: {
      ...data,
      flashcards: [...data.flashcards].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
      ),
    },
  };
}

/**
 * Guarda la valoración de una tarjeta en una sesión de estudio. La
 * propiedad la garantiza el esquema: la FK compuesta
 * (flashcard_id, user_id) → flashcards solo existe si la tarjeta es
 * del usuario, así que valorar una tarjeta ajena viola la FK.
 */
export async function reviewFlashcardAction(
  input: ReviewFlashcardInput,
): Promise<ActionResult<null>> {
  const parsed = reviewFlashcardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_ACTION_ERROR,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("flashcard_reviews").insert({
    user_id: user.id,
    flashcard_id: parsed.data.flashcardId,
    rating: parsed.data.rating,
  });

  if (error) {
    logActionError("flashcards.review", error);
    // 23503: la FK compuesta no existe → tarjeta ajena o borrada.
    return {
      success: false,
      error:
        error.code === "23503" ? "La tarjeta no existe." : GENERIC_ACTION_ERROR,
    };
  }

  return { success: true, data: null };
}

/** Borra un mazo; tarjetas, contexto y reviews caen en cascada. */
export async function deleteFlashcardDeckAction(
  deckId: string,
): Promise<ActionResult<null>> {
  const parsedId = deckIdSchema.safeParse(deckId);
  if (!parsedId.success) {
    return { success: false, error: "El mazo no existe." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("flashcard_decks")
    .delete()
    .eq("id", parsedId.data);

  if (error) {
    logActionError("flashcards.delete", error);
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  revalidatePath(ROUTES.flashcards);
  return { success: true, data: null };
}
