import type { Metadata } from "next";
import { FileText, Layers, ListChecks, Target } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyDocumentsCard } from "@/features/dashboard/components/empty-documents-card";
import { OnboardingProgress } from "@/features/dashboard/components/onboarding-progress";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { UpcomingFeatures } from "@/features/dashboard/components/upcoming-features";
import { UploadCta } from "@/features/dashboard/components/upload-cta";
import { requireUser } from "@/lib/supabase/server";
import { toUserProfile } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = toUserProfile(user);
  const firstName = profile.fullName?.split(" ")[0] ?? profile.email;

  return (
    <div className="flex flex-col gap-8">
      <FadeIn>
        <PageHeader
          title={`Hola, ${firstName}`}
          description="Este es tu centro de estudio. Sube tu temario para empezar a generar material."
        >
          <UploadCta />
        </PageHeader>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Documentos subidos"
            value="0"
            icon={FileText}
            hint="Tu biblioteca está vacía"
          />
          <StatCard
            label="Tests creados"
            value="0"
            icon={ListChecks}
            hint="Genera tests desde tus documentos"
          />
          <StatCard
            label="Flashcards pendientes"
            value="0"
            icon={Layers}
            hint="Nada que repasar todavía"
          />
          <StatCard
            label="Precisión media"
            value="—"
            icon={Target}
            hint="Se calculará con tus primeros tests"
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EmptyDocumentsCard />
          </div>
          <OnboardingProgress />
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <UpcomingFeatures />
      </FadeIn>
    </div>
  );
}
