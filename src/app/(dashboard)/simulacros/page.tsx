import type { Metadata } from "next";
import { Timer } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Simulacros",
};

export default function SimulacrosPage() {
  return (
    <PagePlaceholder
      icon={Timer}
      title="Simulacros"
      description="Exámenes cronometrados en condiciones reales."
      hint="Entrena la gestión del tiempo con simulacros que imitan tu examen oficial."
    />
  );
}
