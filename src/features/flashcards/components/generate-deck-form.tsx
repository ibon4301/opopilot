"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FLASHCARD_COUNTS,
  FLASHCARD_DIFFICULTIES,
  FLASHCARD_DIFFICULTY_LABELS,
  FLASHCARD_TYPE_LABELS,
  FLASHCARD_TYPES,
  type FlashcardCount,
  type FlashcardDifficulty,
  type FlashcardType,
} from "@/constants/flashcards";
import { flashcardDeckRoute } from "@/constants/routes";
import { generateFlashcardDeckAction } from "@/server/actions/flashcards";

interface GenerateDeckFormProps {
  /** Documentos con embeddings, únicos a partir de los que se puede generar. */
  documents: readonly { id: string; filename: string }[];
}

export function GenerateDeckForm({ documents }: GenerateDeckFormProps) {
  const router = useRouter();
  const [documentId, setDocumentId] = useState(documents[0]?.id ?? "");
  const [cardCount, setCardCount] = useState<FlashcardCount>(10);
  const [difficulty, setDifficulty] = useState<FlashcardDifficulty>("mixed");
  const [cardType, setCardType] = useState<FlashcardType>("mixed");
  const [topic, setTopic] = useState("");
  const [isGenerating, startGenerating] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startGenerating(async () => {
      const trimmedTopic = topic.trim();
      const result = await generateFlashcardDeckAction({
        documentId,
        cardCount,
        difficulty,
        cardType,
        topic: trimmedTopic.length > 0 ? trimmedTopic : undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Mazo generado.");
      router.push(flashcardDeckRoute(result.data.deckId));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar un mazo de flashcards</CardTitle>
        <CardDescription>
          La IA crea tarjetas de estudio usando únicamente el contenido de tu
          documento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field>
            <FieldLabel htmlFor="deck-document">Documento</FieldLabel>
            <Select
              value={documentId}
              onValueChange={setDocumentId}
              disabled={isGenerating}
            >
              <SelectTrigger id="deck-document" className="w-full">
                <SelectValue placeholder="Elige un documento" />
              </SelectTrigger>
              <SelectContent>
                {documents.map((document) => (
                  <SelectItem key={document.id} value={document.id}>
                    {document.filename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel>Número de tarjetas</FieldLabel>
              <div
                role="group"
                aria-label="Número de tarjetas"
                className="flex gap-2"
              >
                {FLASHCARD_COUNTS.map((count) => (
                  <Button
                    key={count}
                    type="button"
                    variant={cardCount === count ? "default" : "outline"}
                    aria-pressed={cardCount === count}
                    disabled={isGenerating}
                    onClick={() => setCardCount(count)}
                    className="flex-1"
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>Dificultad</FieldLabel>
              <div role="group" aria-label="Dificultad" className="flex gap-2">
                {FLASHCARD_DIFFICULTIES.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    aria-pressed={difficulty === level}
                    disabled={isGenerating}
                    onClick={() => setDifficulty(level)}
                    className="flex-1"
                  >
                    {FLASHCARD_DIFFICULTY_LABELS[level]}
                  </Button>
                ))}
              </div>
            </Field>
          </div>

          <Field>
            <FieldLabel>Tipo de tarjeta</FieldLabel>
            <div
              role="group"
              aria-label="Tipo de tarjeta"
              className="flex flex-col gap-2 sm:flex-row"
            >
              {FLASHCARD_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={cardType === type ? "default" : "outline"}
                  aria-pressed={cardType === type}
                  disabled={isGenerating}
                  onClick={() => setCardType(type)}
                  className="flex-1"
                >
                  {FLASHCARD_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="deck-topic">Tema (opcional)</FieldLabel>
            <Input
              id="deck-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="p. ej. los plazos del recurso de alzada"
              maxLength={200}
              disabled={isGenerating}
            />
            <FieldDescription>
              Déjalo vacío para generar el mazo sobre el documento completo.
            </FieldDescription>
          </Field>

          <Button
            type="submit"
            disabled={isGenerating || documentId.length === 0}
            className="self-start"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Generando mazo… puede tardar unos segundos
              </>
            ) : (
              <>
                <Sparkles aria-hidden />
                Generar mazo
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
