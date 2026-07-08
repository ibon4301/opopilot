import type { User } from "@supabase/supabase-js";

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
