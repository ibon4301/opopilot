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
  generateTestSchema,
  submitAttemptSchema,
  testIdSchema,
  type GenerateTestInput,
  type SubmitAttemptInput,
} from "@/lib/validations/tests";
import { DocumentContextError } from "@/services/document-context/document-context";
import { EmbeddingError } from "@/services/embeddings/embedding-client";
import {
  submitTestAttempt,
  TestAttemptError,
  type GradedAttempt,
} from "@/services/test-attempts/test-attempt-service";
import { TestGenerationError } from "@/services/test-generation/provider";
import {
  generateTest,
  type GeneratedTestSummary,
} from "@/services/test-generation/test-generation-service";
import type { ActionResult } from "@/types";

export type TestListItem = Tables<"tests"> & {
  documents: Pick<Tables<"documents">, "filename"> | null;
};

/**
 * Pregunta tal y como viaja al cliente para HACER el test: sin
 * correct_option ni explanation, que solo llegan tras corregir.
 */
export type TakeableQuestion = Pick<
  Tables<"questions">,
  "id" | "order_index" | "statement" | "options" | "difficulty"
>;

export type TestDetail = TestListItem & {
  questions: TakeableQuestion[];
};

function toFriendlyError(error: unknown): string {
  return error instanceof TestGenerationError ||
    error instanceof DocumentContextError ||
    error instanceof EmbeddingError
    ? error.message
    : "No se pudo generar el test. Inténtalo de nuevo.";
}

/**
 * Genera un test con IA a partir de un documento indexado y lo guarda.
 * El trabajo pesado (contexto → Gemini → validación → persistencia)
 * vive en services/test-generation; aquí solo auth, validación de
 * entrada y traducción de errores.
 */
export async function generateTestAction(
  input: GenerateTestInput,
): Promise<ActionResult<GeneratedTestSummary>> {
  const parsed = generateTestSchema.safeParse(input);
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
    const result = await generateTest({
      supabase,
      userId: user.id,
      input: parsed.data,
    });
    revalidatePath(ROUTES.tests);
    return { success: true, data: result };
  } catch (error) {
    logActionError("tests.generate", error);
    return { success: false, error: toFriendlyError(error) };
  }
}

/** Tests del usuario (RLS), más recientes primero. */
export async function listTestsAction(): Promise<ActionResult<TestListItem[]>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tests")
    .select("*, documents(filename)")
    .order("created_at", { ascending: false });

  if (error) {
    logActionError("tests.list", error);
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  return { success: true, data };
}

/**
 * Un test con sus preguntas ordenadas, listo para hacerse; RLS limita
 * al dueño. La opción correcta y la explicación se excluyen a
 * propósito: solo las devuelve submitTestAttemptAction al corregir.
 */
export async function getTestAction(
  testId: string,
): Promise<ActionResult<TestDetail>> {
  const parsedId = testIdSchema.safeParse(testId);
  if (!parsedId.success) {
    return { success: false, error: "El test no existe." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_EXPIRED_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tests")
    .select(
      "*, documents(filename), questions(id, order_index, statement, options, difficulty)",
    )
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    logActionError("tests.get", error);
    return { success: false, error: GENERIC_ACTION_ERROR };
  }
  if (!data) {
    return { success: false, error: "El test no existe." };
  }

  return {
    success: true,
    data: {
      ...data,
      questions: [...data.questions].sort(
        (a, b) => a.order_index - b.order_index,
      ),
    },
  };
}

/**
 * Corrige un intento del test y lo guarda en test_attempts /
 * test_attempt_answers. La calificación ocurre íntegramente en el
 * servidor; la respuesta incluye por primera vez la opción correcta y
 * la explicación de cada pregunta.
 */
export async function submitTestAttemptAction(
  input: SubmitAttemptInput,
): Promise<ActionResult<GradedAttempt>> {
  const parsed = submitAttemptSchema.safeParse(input);
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
    const result = await submitTestAttempt({
      supabase,
      userId: user.id,
      input: parsed.data,
    });
    return { success: true, data: result };
  } catch (error) {
    logActionError("tests.attempt", error);
    return {
      success: false,
      error:
        error instanceof TestAttemptError
          ? error.message
          : GENERIC_ACTION_ERROR,
    };
  }
}
