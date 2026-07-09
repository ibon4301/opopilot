import type { Metadata } from "next";
import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROUTES } from "@/constants/routes";
import { getDocuments } from "@/features/documents/queries";
import { GenerateTestForm } from "@/features/tests/components/generate-test-form";
import { TestsEmptyState } from "@/features/tests/components/tests-empty-state";
import { TestsTable } from "@/features/tests/components/tests-table";
import { listTestsAction } from "@/server/actions/tests";

export const metadata: Metadata = {
  title: "Tests",
};

export default async function TestsPage() {
  const [documents, testsResult] = await Promise.all([
    getDocuments(),
    listTestsAction(),
  ]);

  const embeddedDocuments = documents
    .filter((document) => document.status === "embedded")
    .map((document) => ({ id: document.id, filename: document.filename }));

  const tests = testsResult.success ? testsResult.data : [];

  return (
    <FadeIn className="flex flex-col gap-8">
      <PageHeader
        title="Tests"
        description="Genera preguntas tipo test con IA a partir de tus documentos."
      />

      {embeddedDocuments.length > 0 ? (
        <GenerateTestForm documents={embeddedDocuments} />
      ) : (
        <Alert>
          <AlertTitle>Todavía no tienes documentos indexados</AlertTitle>
          <AlertDescription>
            Para generar tests, sube un PDF en{" "}
            <Link href={ROUTES.documents} className="font-medium underline">
              Documentos
            </Link>
            , procésalo y genera sus embeddings.
          </AlertDescription>
        </Alert>
      )}

      {tests.length > 0 ? <TestsTable tests={tests} /> : <TestsEmptyState />}
    </FadeIn>
  );
}
