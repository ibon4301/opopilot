import type { Enums, Tables } from "@/lib/supabase/types";

export type DocumentRow = Tables<"documents">;
export type DocumentStatus = Enums<"document_status">;
