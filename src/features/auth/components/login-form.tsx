"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/server/actions/auth";

function safeNextPath(next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return ROUTES.dashboard;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") === "confirm"
      ? "El enlace no es válido o ha caducado. Inicia sesión o solicita uno nuevo."
      : null,
  );

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await loginAction(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push(safeNextPath(searchParams.get("next")));
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Link
              href={ROUTES.forgotPassword}
              className="text-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ¿La has olvidado?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Iniciar sesión
        </Button>
      </FieldGroup>
    </form>
  );
}
