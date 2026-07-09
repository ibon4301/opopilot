"use server";

import { revalidatePath } from "next/cache";

import { DOCUMENT_MIME_TYPE, DOCUMENTS_BUCKET } from "@/constants/documents";
import { ROUTES } from "@/constants/routes";
import { logActionError } from "@/lib/log";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  documentIdSchema,
  registerDocumentSchema,
  type RegisterDocumentInput,
} from "@/lib/validations/documents";
import type { ActionResult } from "@/types";
import { toDisplayFilename } from "@/utils/filename";

const GENERIC_ERROR = "Algo ha ido mal. Inténtalo de nuevo en unos segundos.";
const SESSION_ERROR = "Tu sesión ha caducado. Vuelve a iniciar sesión.";

/**
 * Registra el documento en base de datos con estado `uploading` y
 * devuelve la ruta de Storage donde el cliente debe subir el archivo.
 * El flujo completo es: register → subida directa a Storage →
 * finalize (o delete si la subida falla).
 */
export async function registerDocumentAction(
  input: RegisterDocumentInput,
): Promise<ActionResult<{ documentId: string; storagePath: string }>> {
  const parsed = registerDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_ERROR,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_ERROR };
  }

  // El id se genera aquí porque storage_path ({user_id}/{document_id}.pdf)
  // debe fijarse en el mismo insert.
  const documentId = crypto.randomUUID();
  const storagePath = `${user.id}/${documentId}.pdf`;

  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    id: documentId,
    user_id: user.id,
    filename: toDisplayFilename(parsed.data.originalFilename),
    original_filename: parsed.data.originalFilename,
    storage_path: storagePath,
    mime_type: DOCUMENT_MIME_TYPE,
    size_bytes: parsed.data.sizeBytes,
    status: "uploading",
  });

  if (error) {
    logActionError("documents.register", error);
    return { success: false, error: GENERIC_ERROR };
  }

  return { success: true, data: { documentId, storagePath } };
}

/**
 * Marca el documento como `ready` tras verificar en el servidor que el
 * archivo existe realmente en Storage: el estado nunca depende solo de
 * lo que afirme el cliente.
 */
export async function finalizeDocumentUploadAction(
  documentId: string,
): Promise<ActionResult> {
  const parsedId = documentIdSchema.safeParse(documentId);
  if (!parsedId.success) {
    return { success: false, error: GENERIC_ERROR };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_ERROR };
  }

  const supabase = await createClient();

  // RLS limita la consulta a los documentos del usuario.
  const { data: document } = await supabase
    .from("documents")
    .select("id, storage_path, status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (!document) {
    return { success: false, error: "El documento no existe." };
  }
  if (document.status !== "uploading") {
    return { success: true, data: undefined };
  }

  const { error: infoError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .info(document.storage_path);

  if (infoError) {
    logActionError("documents.finalize.info", infoError);
    return {
      success: false,
      error: "No se pudo verificar la subida. Inténtalo de nuevo.",
    };
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({ status: "ready" })
    .eq("id", document.id);

  if (updateError) {
    logActionError("documents.finalize.update", updateError);
    return { success: false, error: GENERIC_ERROR };
  }

  revalidatePath(ROUTES.documents);
  return { success: true, data: undefined };
}

/**
 * Elimina el archivo de Storage y después el registro. Este orden es
 * autorreparable: si el borrado del registro fallara, reintentar vuelve
 * a pasar por Storage (borrar un objeto inexistente no es un error) y
 * nunca quedan archivos huérfanos. También sirve como limpieza cuando
 * la subida falla a mitad.
 */
export async function deleteDocumentAction(
  documentId: string,
): Promise<ActionResult> {
  const parsedId = documentIdSchema.safeParse(documentId);
  if (!parsedId.success) {
    return { success: false, error: GENERIC_ERROR };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: SESSION_ERROR };
  }

  const supabase = await createClient();

  const { data: document } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (!document) {
    return { success: false, error: "El documento no existe." };
  }

  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([document.storage_path]);

  if (storageError) {
    logActionError("documents.delete.storage", storageError);
    return {
      success: false,
      error: "No se pudo eliminar el archivo. Inténtalo de nuevo.",
    };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", document.id);

  if (deleteError) {
    logActionError("documents.delete.row", deleteError);
    return { success: false, error: GENERIC_ERROR };
  }

  revalidatePath(ROUTES.documents);
  return { success: true, data: undefined };
}
