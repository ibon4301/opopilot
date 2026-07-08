import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Recupera tu contraseña",
  description: "Te enviaremos un enlace para restablecer tu contraseña.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="¿Has olvidado tu contraseña?"
      description="Te enviaremos un enlace para restablecerla"
      footer={
        <Link
          href={ROUTES.login}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
