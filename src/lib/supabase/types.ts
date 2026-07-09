import type { User } from "@supabase/supabase-js";

/**
 * Helpers de acceso al esquema generado (`database.types.ts`, no editar
 * a mano; regenerar con `npx supabase gen types typescript --local`).
 *
 * Uso: `Tables<"documents">`, `TablesInsert<"flashcards">`,
 * `Enums<"document_status">`.
 */
export type {
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database.types";

/** Perfil mínimo derivado del usuario de Supabase Auth para la UI. */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
}

export function toUserProfile(user: User): UserProfile {
  const fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName,
  };
}
