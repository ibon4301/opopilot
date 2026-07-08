"use server";

import { redirect } from "next/navigation";
import { isAuthApiError } from "@supabase/supabase-js";

import { env } from "@/config/env";
import { ROUTES } from "@/constants/routes";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export type AuthResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

const GENERIC_ERROR = "Algo ha ido mal. Inténtalo de nuevo en unos segundos.";

function translateAuthError(error: unknown): string {
  if (isAuthApiError(error)) {
    switch (error.code) {
      case "invalid_credentials":
        return "Email o contraseña incorrectos.";
      case "email_not_confirmed":
        return "Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.";
      case "user_already_exists":
      case "email_exists":
        return "Ya existe una cuenta con este email.";
      case "weak_password":
        return "La contraseña es demasiado débil.";
      case "same_password":
        return "La nueva contraseña debe ser distinta de la actual.";
      case "over_email_send_rate_limit":
      case "over_request_rate_limit":
        return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
      case "session_expired":
      case "session_not_found":
        return "El enlace ha caducado. Solicita uno nuevo.";
    }
  }
  return GENERIC_ERROR;
}

export async function loginAction(input: LoginInput): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos. Revisa el formulario." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: translateAuthError(error) };
  }

  return { success: true, data: undefined };
}

export async function registerAction(
  input: RegisterInput,
): Promise<AuthResult<{ requiresEmailConfirmation: boolean }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos. Revisa el formulario." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.appUrl}${ROUTES.authConfirm}`,
    },
  });

  if (error) {
    return { success: false, error: translateAuthError(error) };
  }

  return {
    success: true,
    data: { requiresEmailConfirmation: data.session === null },
  };
}

export async function logoutAction(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Introduce un email válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${env.appUrl}${ROUTES.authConfirm}?next=${ROUTES.resetPassword}`,
    },
  );

  // No revelamos si el email existe: solo informamos de errores operativos.
  if (error && isAuthApiError(error) && error.status === 429) {
    return { success: false, error: translateAuthError(error) };
  }

  return { success: true, data: undefined };
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos. Revisa el formulario." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "El enlace de recuperación ha caducado. Solicita uno nuevo.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: translateAuthError(error) };
  }

  return { success: true, data: undefined };
}
