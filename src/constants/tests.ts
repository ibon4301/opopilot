import type { Enums } from "@/lib/supabase/types";

/** Tamaños de test que puede pedir el usuario. */
export const TEST_QUESTION_COUNTS = [5, 10, 20] as const;

export type TestQuestionCount = (typeof TEST_QUESTION_COUNTS)[number];

/** Dificultad solicitada; "mixed" se guarda como difficulty = null. */
export const TEST_DIFFICULTIES = ["easy", "medium", "hard", "mixed"] as const;

export type TestDifficulty = (typeof TEST_DIFFICULTIES)[number];

export const TEST_DIFFICULTY_LABELS: Record<TestDifficulty, string> = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
  mixed: "Mixta",
};

export const QUESTION_DIFFICULTY_LABELS: Record<
  Enums<"question_difficulty">,
  string
> = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
};

/** Letras con las que se muestran las opciones de una pregunta. */
export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
