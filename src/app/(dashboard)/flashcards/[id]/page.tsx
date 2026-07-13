import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FLASHCARD_DIFFICULTY_LABELS } from "@/constants/flashcards";
import { ROUTES } from "@/constants/routes";
import { StudySession } from "@/features/flashcards/components/study-session";
import { getFlashcardDeckAction } from "@/server/actions/flashcards";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = {
  title: "Estudiar flashcards",
};

export default async function FlashcardDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getFlashcardDeckAction(id);

  if (!result.success || result.data.flashcards.length === 0) {
    notFound();
  }

  const deck = result.data;

  return (
    <FadeIn className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href={ROUTES.flashcards}>
            <ArrowLeft aria-hidden />
            Volver a flashcards
          </Link>
        </Button>
        <PageHeader
          title={deck.title}
          description={`${deck.card_count} tarjetas · generado el ${formatDate(deck.created_at)}`}
        >
          <Badge variant="secondary">
            {deck.difficulty
              ? FLASHCARD_DIFFICULTY_LABELS[deck.difficulty]
              : FLASHCARD_DIFFICULTY_LABELS.mixed}
          </Badge>
        </PageHeader>
        {deck.documents && (
          <p className="flex items-center gap-2 text-small text-muted-foreground">
            <FileText className="size-4" aria-hidden />
            {deck.documents.filename}
            {deck.topic && <span>· Tema: {deck.topic}</span>}
          </p>
        )}
      </div>

      <StudySession cards={deck.flashcards} />
    </FadeIn>
  );
}
