import { env } from "@/config/env";

export const siteConfig = {
  name: "OpoPilot",
  title: "OpoPilot — Tu copiloto de IA para oposiciones",
  description:
    "Prepara tu oposición con inteligencia artificial. Convierte tu temario en tests, flashcards y planes de estudio personalizados.",
  url: env.appUrl,
  locale: "es",
} as const;
