import { env } from "@/config/env";
import { DOCUMENT_MIME_TYPE, DOCUMENTS_BUCKET } from "@/constants/documents";
import { createClient } from "@/lib/supabase/client";

/**
 * Sube el archivo directamente a Supabase Storage con XMLHttpRequest.
 * supabase-js no expone progreso de subida, y pasar el PDF por una
 * Server Action lo transferiría dos veces; el endpoint REST de Storage
 * con el JWT del usuario da progreso real y mantiene la seguridad en el
 * servidor (RLS de la carpeta + límites de MIME/tamaño del bucket).
 */
export async function uploadFileToStorage(
  storagePath: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("session_expired");
  }

  const url = `${env.supabaseUrl}/storage/v1/object/${DOCUMENTS_BUCKET}/${storagePath}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", env.supabaseAnonKey);
    xhr.setRequestHeader("Content-Type", DOCUMENT_MIME_TYPE);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`storage_upload_failed_${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network_error"));
    xhr.onabort = () => reject(new Error("upload_aborted"));

    xhr.send(file);
  });
}
