import { Sparkles, type LucideIcon } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";

import { PageHeader } from "./page-header";

interface PagePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  hint: string;
}

export function PagePlaceholder({
  icon: Icon,
  title,
  description,
  hint,
}: PagePlaceholderProps) {
  return (
    <FadeIn className="flex flex-col gap-8">
      <PageHeader title={title} description={description} />
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent">
          <Icon className="size-6 text-primary" aria-hidden />
        </div>
        <Badge variant="secondary" className="mt-6 gap-1.5">
          <Sparkles className="size-3" aria-hidden />
          Próximamente
        </Badge>
        <p className="mt-4 max-w-md text-body font-medium text-balance">
          {hint}
        </p>
        <p className="mt-2 max-w-md text-small text-muted-foreground">
          Estamos construyendo esta sección. Estará disponible en una próxima
          fase.
        </p>
      </div>
    </FadeIn>
  );
}
