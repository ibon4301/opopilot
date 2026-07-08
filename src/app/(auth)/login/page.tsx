import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Inicia sesión",
  description: "Accede a tu cuenta de OpoPilot.",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Bienvenido de nuevo"
      description="Inicia sesión para continuar estudiando"
      footer={
        <p>
          ¿No tienes cuenta?{" "}
          <Link
            href={ROUTES.register}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      }
    >
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
