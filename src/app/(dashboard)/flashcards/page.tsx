import type { Metadata } from "next";
import { Layers } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Flashcards",
};

export default function FlashcardsPage() {
  return (
    <PagePlaceholder
      icon={Layers}
      title="Flashcards"
      description="Memoriza conceptos clave con repaso espaciado."
      hint="El algoritmo priorizará automáticamente las tarjetas que más te cuestan."
    />
  );
}
