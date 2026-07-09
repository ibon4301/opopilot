// Variables exclusivas del servidor: nunca deben llegar al bundle de
// cliente. El guard hace que cualquier import accidental desde un
// Client Component falle en desarrollo de forma visible.
if (typeof window !== "undefined") {
  throw new Error("env.server.ts solo puede importarse en el servidor.");
}

export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
} as const;
