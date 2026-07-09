import { createClient } from "@/lib/supabase/server";

import type { DocumentRow } from "./types";

/** Documentos del usuario actual (RLS), más recientes primero. */
export async function getDocuments(): Promise<DocumentRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar los documentos.");
  }

  return data;
}
