import { z } from "zod";

const email = z.email("Introduce un email válido");
const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Introduce tu contraseña"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres"),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
