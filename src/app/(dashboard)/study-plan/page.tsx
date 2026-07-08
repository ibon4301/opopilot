import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Plan de estudio",
};

export default function StudyPlanPage() {
  return (
    <PagePlaceholder
      icon={CalendarRange}
      title="Plan de estudio"
      description="Un plan personalizado según tu temario y tu fecha de examen."
      hint="OpoPilot organizará qué estudiar cada día para llegar al examen con todo repasado."
    />
  );
}
