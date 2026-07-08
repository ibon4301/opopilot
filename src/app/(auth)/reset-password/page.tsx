import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Restablece tu contraseña",
  description: "Elige una nueva contraseña para tu cuenta.",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Nueva contraseña"
      description="Elige una nueva contraseña para tu cuenta"
      footer={
        <Link
          href={ROUTES.forgotPassword}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Solicitar un enlace nuevo
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
