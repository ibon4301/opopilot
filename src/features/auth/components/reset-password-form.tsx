"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { resetPasswordAction } from "@/server/actions/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const result = await resetPasswordAction(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    toast.success("Contraseña actualizada");
    router.push(ROUTES.dashboard);
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
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
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
          Guardar contraseña
        </Button>
      </FieldGroup>
    </form>
  );
}
