import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/config/env";
import { serverEnv } from "@/config/env.server";
import type { Database } from "@/lib/supabase/types";

/**
 * Cliente con service role: se salta RLS. Solo para servicios de
 * servidor (pipeline de procesamiento, webhooks); las Server Actions
 * que actúan "como el usuario" deben seguir usando lib/supabase/server.
 */
export function createAdminClient() {
  if (!serverEnv.supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no está configurada. Cópiala de Supabase → Project Settings → API keys.",
    );
  }

  return createSupabaseClient<Database>(
    env.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
