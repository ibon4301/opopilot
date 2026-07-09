import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPTION_LETTERS, QUESTION_DIFFICULTY_LABELS } from "@/constants/tests";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/** options viaja como jsonb; solo se pintan las entradas que son texto. */
function getOptions(question: Tables<"questions">): string[] {
  return Array.isArray(question.options)
    ? question.options.filter(
        (option): option is string => typeof option === "string",
      )
    : [];
}

export function TestQuestionsList({
  questions,
}: {
  questions: Tables<"questions">[];
}) {
  return (
    <ol className="flex flex-col gap-4">
      {questions.map((question, index) => (
        <li key={question.id}>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle className="text-body font-medium">
                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                {question.statement}
              </CardTitle>
              <Badge variant="secondary" className="shrink-0">
                {QUESTION_DIFFICULTY_LABELS[question.difficulty]}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2">
                {getOptions(question).map((option, optionIndex) => {
                  const isCorrect = optionIndex === question.correct_option;
                  return (
                    <li
                      key={optionIndex}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border px-3 py-2 text-small",
                        isCorrect && "border-primary/40 bg-primary/5",
                      )}
                    >
                      <span
                        className={cn(
                          "font-medium",
                          isCorrect ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {OPTION_LETTERS[optionIndex] ?? optionIndex + 1}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isCorrect && (
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
              {question.explanation && (
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-small text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Explicación:{" "}
                  </span>
                  {question.explanation}
                </div>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}
