import { CheckCircle2, Circle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Crea tu cuenta", done: true },
  { label: "Sube tu primer documento", done: false },
  { label: "Genera tu primer test", done: false },
  { label: "Completa un simulacro", done: false },
] as const;

export function OnboardingProgress() {
  const completed = STEPS.filter((step) => step.done).length;
  const percentage = Math.round((completed / STEPS.length) * 100);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-h4">Primeros pasos</CardTitle>
        <CardDescription>
          {completed} de {STEPS.length} completados
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Progress
          value={percentage}
          aria-label={`Progreso inicial: ${percentage}%`}
        />
        <ul className="flex flex-col gap-3">
          {STEPS.map((step) => (
            <li
              key={step.label}
              className="flex items-center gap-2.5 text-small"
            >
              {step.done ? (
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
              ) : (
                <Circle
                  className="size-4 text-muted-foreground/50"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  step.done
                    ? "text-muted-foreground line-through"
                    : "text-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
