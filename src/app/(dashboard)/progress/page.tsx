import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Progreso",
};

export default function ProgressPage() {
  return (
    <PagePlaceholder
      icon={TrendingUp}
      title="Progreso"
      description="Tu evolución, punto por punto."
      hint="Estadísticas de aciertos, temas dominados y áreas que necesitan más repaso."
    />
  );
}
