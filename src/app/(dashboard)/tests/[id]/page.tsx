import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { TestDifficultyBadge } from "@/features/tests/components/test-difficulty-badge";
import { TestQuestionsList } from "@/features/tests/components/test-questions-list";
import { getTestAction } from "@/server/actions/tests";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = {
  title: "Test",
};

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTestAction(id);

  if (!result.success) {
    notFound();
  }

  const test = result.data;

  return (
    <FadeIn className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href={ROUTES.tests}>
            <ArrowLeft aria-hidden />
            Volver a tests
          </Link>
        </Button>
        <PageHeader
          title={test.title}
          description={`${test.question_count} preguntas · generado el ${formatDate(test.created_at)}`}
        >
          <TestDifficultyBadge difficulty={test.difficulty} />
        </PageHeader>
        {test.documents && (
          <p className="flex items-center gap-2 text-small text-muted-foreground">
            <FileText className="size-4" aria-hidden />
            {test.documents.filename}
            {test.topic && <span>· Tema: {test.topic}</span>}
          </p>
        )}
      </div>

      <TestQuestionsList questions={test.questions} />
    </FadeIn>
  );
}
