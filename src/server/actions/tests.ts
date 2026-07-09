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
  testIdSchema,
  type GenerateTestInput,
} from "@/lib/validations/tests";
import { EmbeddingError } from "@/services/embeddings/embedding-client";
import { TestGenerationError } from "@/services/test-generation/provider";
import {
  generateTest,
  type GeneratedTestSummary,
} from "@/services/test-generation/test-generation-service";
import type { ActionResult } from "@/types";

export type TestListItem = Tables<"tests"> & {
  documents: Pick<Tables<"documents">, "filename"> | null;
};

export type TestDetail = TestListItem & {
  questions: Tables<"questions">[];
};

function toFriendlyError(error: unknown): string {
  return error instanceof TestGenerationError || error instanceof EmbeddingError
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

/** Un test con sus preguntas ordenadas; RLS limita al dueño. */
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
    .select("*, documents(filename), questions(*)")
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
