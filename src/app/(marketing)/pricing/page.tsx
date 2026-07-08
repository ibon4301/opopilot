import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Precios",
  description: "Planes y precios de OpoPilot. Disponibles muy pronto.",
};

export default function PricingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Badge variant="secondary" className="gap-1.5">
        <Sparkles className="size-3" aria-hidden />
        Próximamente
      </Badge>
      <h1 className="mt-6 text-h1">Precios</h1>
      <p className="mt-4 max-w-md text-body text-muted-foreground">
        Estamos definiendo los planes de OpoPilot. Podrás empezar gratis y pagar
        solo cuando lo necesites.
      </p>
      <Button asChild variant="ghost" className="mt-8">
        <Link href={ROUTES.home}>
          <ArrowLeft aria-hidden />
          Volver al inicio
        </Link>
      </Button>
    </main>
  );
}
