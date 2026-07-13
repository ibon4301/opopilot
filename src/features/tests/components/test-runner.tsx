"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OPTION_LETTERS, QUESTION_DIFFICULTY_LABELS } from "@/constants/tests";
import { cn } from "@/lib/utils";
import {
  submitTestAttemptAction,
  type TakeableQuestion,
} from "@/server/actions/tests";
import type { GradedAttempt } from "@/services/test-attempts/test-attempt-service";

/** options viaja como jsonb; solo se pintan las entradas que son texto. */
function getOptions(question: TakeableQuestion): string[] {
  return Array.isArray(question.options)
    ? question.options.filter(
        (option): option is string => typeof option === "string",
      )
    : [];
}

interface TestRunnerProps {
  testId: string;
  questions: TakeableQuestion[];
}

/**
 * Interfaz para HACER el test: en pending el cliente solo conoce
 * enunciados y opciones (la correcta nunca viaja); al corregir, el
 * servidor califica, guarda el intento y devuelve correcta y
 * explicación de cada pregunta.
 */
export function TestRunner({ testId, questions }: TestRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<GradedAttempt | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();

  const gradedByQuestionId = useMemo(
    () =>
      new Map(
        result?.questions.map((question) => [question.questionId, question]),
      ),
    [result],
  );

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const isSubmitted = result !== null;

  function selectOption(questionId: string, optionIndex: number) {
    if (isSubmitted || isSubmitting) return;
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  }

  function handleSubmit() {
    startSubmitting(async () => {
      const response = await submitTestAttemptAction({
        testId,
        answers: Object.entries(answers).map(
          ([questionId, selectedOption]) => ({ questionId, selectedOption }),
        ),
      });

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      setResult(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-6">
      {isSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h2 tabular-nums">
              {new Intl.NumberFormat("es-ES", {
                maximumFractionDigits: 1,
              }).format(result.score)}
              %
            </CardTitle>
            <CardDescription>
              {result.correctCount} de {result.questionCount} respuestas
              correctas. Repasa las explicaciones o vuelve a intentarlo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleRetry}>
              <RotateCcw aria-hidden />
              Reintentar test
            </Button>
          </CardContent>
        </Card>
      )}

      <ol className="flex flex-col gap-4">
        {questions.map((question, index) => {
          const graded = gradedByQuestionId.get(question.id);
          const selected = answers[question.id];

          return (
            <li key={question.id}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <CardTitle className="text-body font-medium">
                    <span className="mr-2 text-muted-foreground">
                      {index + 1}.
                    </span>
                    {question.statement}
                  </CardTitle>
                  <div className="flex shrink-0 items-center gap-2">
                    {graded && (
                      <Badge
                        variant={graded.isCorrect ? "default" : "destructive"}
                      >
                        {graded.isCorrect ? "Correcta" : "Incorrecta"}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {QUESTION_DIFFICULTY_LABELS[question.difficulty]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div
                    role="radiogroup"
                    aria-label={`Opciones de la pregunta ${index + 1}`}
                    className="flex flex-col gap-2"
                  >
                    {getOptions(question).map((option, optionIndex) => {
                      const isSelected = selected === optionIndex;
                      const isCorrectOption =
                        graded?.correctOption === optionIndex;
                      const isWrongSelection =
                        graded !== undefined && isSelected && !graded.isCorrect;

                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={isSubmitted || isSubmitting}
                          onClick={() => selectOption(question.id, optionIndex)}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-small transition-colors",
                            !isSubmitted &&
                              "hover:border-primary/40 hover:bg-muted/60",
                            isSelected &&
                              !isSubmitted &&
                              "border-primary bg-primary/5",
                            isCorrectOption && "border-primary/40 bg-primary/5",
                            isWrongSelection &&
                              "border-destructive/40 bg-destructive/5",
                          )}
                        >
                          <span
                            className={cn(
                              "font-medium",
                              isCorrectOption || (isSelected && !isSubmitted)
                                ? "text-primary"
                                : isWrongSelection
                                  ? "text-destructive"
                                  : "text-muted-foreground",
                            )}
                          >
                            {OPTION_LETTERS[optionIndex] ?? optionIndex + 1}
                          </span>
                          <span className="flex-1">{option}</span>
                          {isCorrectOption && (
                            <CheckCircle2
                              className="mt-0.5 size-4 shrink-0 text-primary"
                              aria-hidden
                            />
                          )}
                          {isWrongSelection && (
                            <XCircle
                              className="mt-0.5 size-4 shrink-0 text-destructive"
                              aria-hidden
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {graded?.explanation && (
                    <div className="rounded-lg bg-muted/60 px-3 py-2 text-small text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Explicación:{" "}
                      </span>
                      {graded.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      {!isSubmitted && (
        <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-xl border bg-background/95 px-4 py-3 shadow-raised backdrop-blur">
          <p
            className="text-small text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {answeredCount} de {questions.length} respondidas
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Corrigiendo…
              </>
            ) : (
              "Corregir test"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
