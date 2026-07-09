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
import { testDetailRoute } from "@/constants/routes";
import {
  TEST_DIFFICULTIES,
  TEST_DIFFICULTY_LABELS,
  TEST_QUESTION_COUNTS,
  type TestDifficulty,
  type TestQuestionCount,
} from "@/constants/tests";
import { generateTestAction } from "@/server/actions/tests";

interface GenerateTestFormProps {
  /** Documentos con embeddings, únicos a partir de los que se puede generar. */
  documents: readonly { id: string; filename: string }[];
}

export function GenerateTestForm({ documents }: GenerateTestFormProps) {
  const router = useRouter();
  const [documentId, setDocumentId] = useState(documents[0]?.id ?? "");
  const [questionCount, setQuestionCount] = useState<TestQuestionCount>(10);
  const [difficulty, setDifficulty] = useState<TestDifficulty>("mixed");
  const [topic, setTopic] = useState("");
  const [isGenerating, startGenerating] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startGenerating(async () => {
      const trimmedTopic = topic.trim();
      const result = await generateTestAction({
        documentId,
        questionCount,
        difficulty,
        topic: trimmedTopic.length > 0 ? trimmedTopic : undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Test generado.");
      router.push(testDetailRoute(result.data.testId));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar un test</CardTitle>
        <CardDescription>
          La IA crea preguntas tipo test usando únicamente el contenido de tu
          documento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field>
            <FieldLabel htmlFor="test-document">Documento</FieldLabel>
            <Select
              value={documentId}
              onValueChange={setDocumentId}
              disabled={isGenerating}
            >
              <SelectTrigger id="test-document" className="w-full">
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
              <FieldLabel>Número de preguntas</FieldLabel>
              <div
                role="group"
                aria-label="Número de preguntas"
                className="flex gap-2"
              >
                {TEST_QUESTION_COUNTS.map((count) => (
                  <Button
                    key={count}
                    type="button"
                    variant={questionCount === count ? "default" : "outline"}
                    aria-pressed={questionCount === count}
                    disabled={isGenerating}
                    onClick={() => setQuestionCount(count)}
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
                {TEST_DIFFICULTIES.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    aria-pressed={difficulty === level}
                    disabled={isGenerating}
                    onClick={() => setDifficulty(level)}
                    className="flex-1"
                  >
                    {TEST_DIFFICULTY_LABELS[level]}
                  </Button>
                ))}
              </div>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="test-topic">Tema (opcional)</FieldLabel>
            <Input
              id="test-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="p. ej. los plazos del recurso de alzada"
              maxLength={200}
              disabled={isGenerating}
            />
            <FieldDescription>
              Déjalo vacío para generar el test sobre el documento completo.
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
                Generando test… puede tardar unos segundos
              </>
            ) : (
              <>
                <Sparkles aria-hidden />
                Generar test
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
