import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Documentos",
};

export default function DocumentsPage() {
  return (
    <PagePlaceholder
      icon={FileText}
      title="Documentos"
      description="Tu biblioteca de temarios y apuntes en PDF."
      hint="Sube tu temario y OpoPilot lo convertirá en tests, flashcards y resúmenes."
    />
  );
}
