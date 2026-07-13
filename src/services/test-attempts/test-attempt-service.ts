import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import type { SubmitAttemptInput } from "@/lib/validations/tests";

/** Error con mensaje pensado para mostrarse al usuario tal cual. */
export class TestAttemptError extends Error {}

type Supabase = SupabaseClient<Database>;

export interface GradedQuestion {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  correctOption: number;
  explanation: string | null;
}

export interface GradedAttempt {
  attemptId: string;
  score: number;
  correctCount: number;
  questionCount: number;
  questions: GradedQuestion[];
}

export interface SubmitTestAttemptParams {
  /** Cliente en contexto del usuario: RLS decide qué puede leer y escribir. */
  supabase: Supabase;
  userId: string;
  input: SubmitAttemptInput;
}

/**
 * Corrige un intento y lo persiste: exige el test completo (todas las
 * preguntas respondidas, ninguna desconocida), califica en el servidor
 * —la opción correcta nunca viajó al cliente— y guarda el intento con
 * sus respuestas en test_attempts / test_attempt_answers. Devuelve la
 * corrección completa, que es el único momento en el que correcta y
 * explicación llegan al cliente.
 */
export async function submitTestAttempt({
  supabase,
  userId,
  input,
}: SubmitTestAttemptParams): Promise<GradedAttempt> {
  // RLS limita la lectura al dueño del test.
  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("id, status, questions(id, options, correct_option, explanation)")
    .eq("id", input.testId)
    .maybeSingle();

  if (testError) {
    throw testError;
  }
  if (!test) {
    throw new TestAttemptError("El test no existe.");
  }
  if (test.status !== "ready" || test.questions.length === 0) {
    throw new TestAttemptError("Este test no se puede corregir.");
  }

  const answerByQuestionId = new Map(
    input.answers.map((answer) => [answer.questionId, answer.selectedOption]),
  );
  if (answerByQuestionId.size !== input.answers.length) {
    throw new TestAttemptError("Hay preguntas con más de una respuesta.");
  }
  if (answerByQuestionId.size !== test.questions.length) {
    throw new TestAttemptError(
      "Responde todas las preguntas antes de corregir.",
    );
  }

  const graded: GradedQuestion[] = test.questions.map((question) => {
    const selectedOption = answerByQuestionId.get(question.id);
    const optionCount = Array.isArray(question.options)
      ? question.options.length
      : 0;

    if (selectedOption === undefined || selectedOption >= optionCount) {
      throw new TestAttemptError(
        "Alguna respuesta no corresponde a este test. Recarga la página e inténtalo de nuevo.",
      );
    }

    return {
      questionId: question.id,
      selectedOption,
      isCorrect: selectedOption === question.correct_option,
      correctOption: question.correct_option,
      explanation: question.explanation,
    };
  });

  const correctCount = graded.filter((question) => question.isCorrect).length;
  const questionCount = graded.length;
  const score = Math.round((correctCount / questionCount) * 10000) / 100;

  // El intento se crea al corregir: started_at y completed_at son el
  // mismo instante. Se fijan ambos desde aquí porque mezclar el reloj de
  // Node con el default now() de la DB puede violar el check
  // completed_at >= started_at.
  const gradedAt = new Date().toISOString();

  const { data: attempt, error: attemptError } = await supabase
    .from("test_attempts")
    .insert({
      test_id: input.testId,
      user_id: userId,
      started_at: gradedAt,
      completed_at: gradedAt,
      correct_count: correctCount,
      question_count: questionCount,
      score,
    })
    .select("id")
    .single();

  if (attemptError) {
    throw attemptError;
  }

  const { error: answersError } = await supabase
    .from("test_attempt_answers")
    .insert(
      graded.map((question) => ({
        attempt_id: attempt.id,
        question_id: question.questionId,
        user_id: userId,
        selected_option: question.selectedOption,
        is_correct: question.isCorrect,
      })),
    );

  if (answersError) {
    // Sin transacciones entre peticiones PostgREST: se limpia el
    // intento huérfano (sus respuestas caen en cascada).
    await supabase.from("test_attempts").delete().eq("id", attempt.id);
    throw answersError;
  }

  return {
    attemptId: attempt.id,
    score,
    correctCount,
    questionCount,
    questions: graded,
  };
}
