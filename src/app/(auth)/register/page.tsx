import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Crea tu cuenta",
  description: "Empieza a preparar tu oposición con OpoPilot.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Empieza a preparar tu oposición en minutos"
      footer={
        <p>
          ¿Ya tienes cuenta?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
