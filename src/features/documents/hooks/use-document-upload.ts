"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { DOCUMENT_MIME_TYPE } from "@/constants/documents";
import { pdfFileSchema } from "@/lib/validations/documents";
import {
  deleteDocumentAction,
  finalizeDocumentUploadAction,
  registerDocumentAction,
} from "@/server/actions/documents";

import { uploadFileToStorage } from "../lib/upload-file-to-storage";

export type UploadPhase = "idle" | "uploading" | "finalizing";

interface UploadState {
  phase: UploadPhase;
  progress: number;
  filename: string | null;
}

const IDLE_STATE: UploadState = { phase: "idle", progress: 0, filename: null };

/**
 * Orquesta el flujo completo de subida:
 * validar → registrar en DB (`uploading`) → subir a Storage con
 * progreso → verificar y marcar `ready`. Si algo falla después de
 * registrar, elimina el registro para no dejar huérfanos.
 */
export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>(IDLE_STATE);

  const upload = useCallback(async (file: File) => {
    const parsedFile = pdfFileSchema.safeParse(file);
    if (!parsedFile.success) {
      toast.error(parsedFile.error.issues[0]?.message ?? "Archivo no válido");
      return;
    }

    setState({ phase: "uploading", progress: 0, filename: file.name });

    const registered = await registerDocumentAction({
      originalFilename: file.name,
      mimeType: DOCUMENT_MIME_TYPE,
      sizeBytes: file.size,
    });

    if (!registered.success) {
      setState(IDLE_STATE);
      toast.error(registered.error);
      return;
    }

    const { documentId, storagePath } = registered.data;

    try {
      await uploadFileToStorage(storagePath, file, (percent) =>
        setState((current) => ({ ...current, progress: percent })),
      );

      setState((current) => ({
        ...current,
        phase: "finalizing",
        progress: 100,
      }));

      const finalized = await finalizeDocumentUploadAction(documentId);
      if (!finalized.success) {
        throw new Error(finalized.error);
      }

      toast.success("Documento subido correctamente");
    } catch {
      // Limpieza best-effort: sin el registro no quedan huérfanos ni
      // filas fantasma; si también falla, la fila queda en `uploading`
      // y puede eliminarse desde la lista.
      await deleteDocumentAction(documentId).catch(() => undefined);
      toast.error("No se pudo subir el documento. Inténtalo de nuevo.");
    } finally {
      setState(IDLE_STATE);
    }
  }, []);

  return {
    upload,
    phase: state.phase,
    progress: state.progress,
    filename: state.filename,
    isUploading: state.phase !== "idle",
  };
}
