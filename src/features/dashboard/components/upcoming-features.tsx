import {
  CalendarRange,
  Layers,
  ListChecks,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface UpcomingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: readonly UpcomingFeature[] = [
  {
    icon: ListChecks,
    title: "Tests con IA",
    description: "Preguntas generadas automáticamente desde tu temario.",
  },
  {
    icon: Layers,
    title: "Flashcards inteligentes",
    description: "Repaso espaciado que prioriza lo que se te olvida.",
  },
  {
    icon: CalendarRange,
    title: "Plan de estudio",
    description: "Un plan personalizado según tu fecha de examen.",
  },
  {
    icon: MessageSquare,
    title: "Chat con tu temario",
    description: "Pregunta cualquier duda y obtén respuestas con citas.",
  },
];

export function UpcomingFeatures() {
  return (
    <section aria-labelledby="upcoming-features-title">
      <div className="mb-4 flex items-center gap-3">
        <h2 id="upcoming-features-title" className="text-h4">
          Próximas funciones
        </h2>
        <Badge variant="secondary">En desarrollo</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="py-5">
            <CardContent className="flex flex-col gap-2.5 px-5">
              <feature.icon className="size-5 text-primary" aria-hidden />
              <p className="text-small font-medium">{feature.title}</p>
              <p className="text-caption text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
