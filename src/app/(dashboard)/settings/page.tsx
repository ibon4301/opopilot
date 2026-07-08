import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Ajustes",
};

export default function SettingsPage() {
  return (
    <PagePlaceholder
      icon={Settings}
      title="Ajustes"
      description="Gestiona tu perfil y tus preferencias."
      hint="Podrás editar tu perfil, cambiar tu contraseña y configurar notificaciones."
    />
  );
}
