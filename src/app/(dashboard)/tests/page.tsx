import type { Metadata } from "next";
import { ListChecks } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Tests",
};

export default function TestsPage() {
  return (
    <PagePlaceholder
      icon={ListChecks}
      title="Tests"
      description="Practica con preguntas generadas por IA desde tu temario."
      hint="Crea tests ilimitados con corrección instantánea y explicaciones de cada respuesta."
    />
  );
}
