import type { Metadata } from "next";
import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROUTES } from "@/constants/routes";
import { getDocuments } from "@/features/documents/queries";
import { DecksEmptyState } from "@/features/flashcards/components/decks-empty-state";
import { DecksTable } from "@/features/flashcards/components/decks-table";
import { GenerateDeckForm } from "@/features/flashcards/components/generate-deck-form";
import { listFlashcardDecksAction } from "@/server/actions/flashcards";

export const metadata: Metadata = {
  title: "Flashcards",
};

export default async function FlashcardsPage() {
  const [documents, decksResult] = await Promise.all([
    getDocuments(),
    listFlashcardDecksAction(),
  ]);

  const embeddedDocuments = documents
    .filter((document) => document.status === "embedded")
    .map((document) => ({ id: document.id, filename: document.filename }));

  const decks = decksResult.success ? decksResult.data : [];

  return (
    <FadeIn className="flex flex-col gap-8">
      <PageHeader
        title="Flashcards"
        description="Genera tarjetas de estudio con IA y repásalas a tu ritmo."
      />

      {embeddedDocuments.length > 0 ? (
        <GenerateDeckForm documents={embeddedDocuments} />
      ) : (
        <Alert>
          <AlertTitle>Todavía no tienes documentos indexados</AlertTitle>
          <AlertDescription>
            Para generar flashcards, sube un PDF en{" "}
            <Link href={ROUTES.documents} className="font-medium underline">
              Documentos
            </Link>
            , procésalo y genera sus embeddings.
          </AlertDescription>
        </Alert>
      )}

      {decks.length > 0 ? <DecksTable decks={decks} /> : <DecksEmptyState />}
    </FadeIn>
  );
}
