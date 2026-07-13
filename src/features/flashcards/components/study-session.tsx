"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Lightbulb, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FLASHCARD_RATING_LABELS,
  FLASHCARD_RATINGS,
  type FlashcardRating,
} from "@/constants/flashcards";
import { ROUTES } from "@/constants/routes";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { reviewFlashcardAction } from "@/server/actions/flashcards";

interface StudySessionProps {
  cards: Tables<"flashcards">[];
}

const EMPTY_COUNTS: Record<FlashcardRating, number> = {
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
};

/**
 * Sesión de estudio: anverso → "Mostrar respuesta" → valoración →
 * siguiente tarjeta. El reverso, la pista y la página de origen no se
 * renderizan hasta revelar. Cada valoración se guarda en
 * flashcard_reviews; la sesión avanza aunque puedan repasarse los
 * resultados al final y repetirse entera.
 */
export function StudySession({ cards }: StudySessionProps) {
  const [index, setIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [counts, setCounts] =
    useState<Record<FlashcardRating, number>>(EMPTY_COUNTS);
  const [isSaving, startSaving] = useTransition();

  const isFinished = index >= cards.length;
  const card = cards[index];
  const ratedCount = FLASHCARD_RATINGS.reduce(
    (total, rating) => total + counts[rating],
    0,
  );

  function handleRate(rating: FlashcardRating) {
    if (!card || isSaving) return;

    startSaving(async () => {
      const result = await reviewFlashcardAction({
        flashcardId: card.id,
        rating,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setCounts((current) => ({
        ...current,
        [rating]: current[rating] + 1,
      }));
      setIsRevealed(false);
      setIndex((current) => current + 1);
    });
  }

  function handleRestart() {
    setIndex(0);
    setIsRevealed(false);
    setCounts(EMPTY_COUNTS);
  }

  if (isFinished) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle>Sesión completada</CardTitle>
          <CardDescription>
            Has repasado {ratedCount} tarjetas. Así ha ido:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FLASHCARD_RATINGS.map((rating) => (
              <div
                key={rating}
                className="flex flex-col items-center gap-1 rounded-lg border px-3 py-3"
              >
                <dt className="text-small text-muted-foreground">
                  {FLASHCARD_RATING_LABELS[rating]}
                </dt>
                <dd
                  className={cn(
                    "text-h3 font-semibold tabular-nums",
                    rating === "again" &&
                      counts.again > 0 &&
                      "text-destructive",
                  )}
                >
                  {counts[rating]}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button onClick={handleRestart}>
            <RotateCcw aria-hidden />
            Estudiar de nuevo
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.flashcards}>Volver a flashcards</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // isFinished ya lo garantiza; la guarda explícita se lo cuenta a TS.
  if (!card) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-muted-foreground tabular-nums">
          Tarjeta {index + 1} de {cards.length}
        </p>
        <p
          className="text-small text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {ratedCount} valoradas
        </p>
      </div>
      <Progress
        value={(index / cards.length) * 100}
        aria-label="Progreso de la sesión"
      />

      <Card className="min-h-64">
        <CardHeader>
          <CardDescription>Anverso</CardDescription>
          <CardTitle className="text-h3 leading-snug">{card.front}</CardTitle>
        </CardHeader>

        {/* El reverso solo entra en el árbol una vez revelado. */}
        {isRevealed && (
          <CardContent className="flex flex-col gap-4 border-t pt-6">
            <div className="flex flex-col gap-1">
              <p className="text-small text-muted-foreground">Reverso</p>
              <p className="text-body">{card.back}</p>
            </div>
            {card.hint && (
              <p className="flex items-start gap-2 text-small text-muted-foreground">
                <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
                {card.hint}
              </p>
            )}
            {card.source_page && (
              <Badge variant="secondary" className="self-start">
                Página {card.source_page}
              </Badge>
            )}
          </CardContent>
        )}

        <CardFooter>
          {isRevealed ? (
            <div
              role="group"
              aria-label="¿Cómo la sabías?"
              className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {FLASHCARD_RATINGS.map((rating) => (
                <Button
                  key={rating}
                  variant={rating === "again" ? "destructive" : "outline"}
                  disabled={isSaving}
                  onClick={() => handleRate(rating)}
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    FLASHCARD_RATING_LABELS[rating]
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <Button className="w-full" onClick={() => setIsRevealed(true)}>
              <Eye aria-hidden />
              Mostrar respuesta
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
