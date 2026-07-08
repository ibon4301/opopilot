"use client";

import { useState } from "react";
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
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/server/actions/auth";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const result = await forgotPasswordAction(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setEmailSent(true);
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
          Si existe una cuenta con ese email, te hemos enviado un enlace para
          restablecer tu contraseña.
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Enviar enlace
        </Button>
      </FieldGroup>
    </form>
  );
}
