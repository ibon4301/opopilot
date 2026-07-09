import type { Metadata } from "next";

import { FadeIn } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentsEmptyState } from "@/features/documents/components/documents-empty-state";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import { SemanticSearchCard } from "@/features/documents/components/semantic-search-card";
import { UploadDropzone } from "@/features/documents/components/upload-dropzone";
import { getDocuments } from "@/features/documents/queries";

export const metadata: Metadata = {
  title: "Documentos",
};

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <FadeIn className="flex flex-col gap-8">
      <PageHeader
        title="Documentos"
        description="Tu biblioteca de temarios y apuntes en PDF."
      />
      <UploadDropzone />
      {documents.length > 0 ? (
        <DocumentsTable documents={documents} />
      ) : (
        <DocumentsEmptyState />
      )}
      {documents.some((document) => document.status === "embedded") && (
        <SemanticSearchCard />
      )}
    </FadeIn>
  );
}
