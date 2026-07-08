"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
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
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/server/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const result = await registerAction(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    if (result.data.requiresEmailConfirmation) {
      setEmailSent(true);
      return;
    }

    router.push(ROUTES.dashboard);
    router.refresh();
  }

  if (emailSent) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-4 text-center"
        role="status"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent">
          <MailCheck className="size-6 text-primary" aria-hidden />
        </div>
        <p className="text-body font-medium">Revisa tu bandeja de entrada</p>
        <p className="max-w-xs text-small text-muted-foreground">
          Te hemos enviado un enlace para confirmar tu cuenta. Después podrás
          iniciar sesión.
        </p>
      </div>
    );
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
        <Field data-invalid={!!errors.fullName}>
          <FieldLabel htmlFor="fullName">Nombre completo</FieldLabel>
          <Input
            id="fullName"
            placeholder="María García"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            {...form.register("fullName")}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>
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
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">
            Confirmar contraseña
          </FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Crear cuenta
        </Button>
      </FieldGroup>
    </form>
  );
}
