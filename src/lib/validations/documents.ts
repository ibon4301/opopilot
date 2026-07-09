import { z } from "zod";

import {
  DOCUMENT_EXTENSION,
  DOCUMENT_MAX_SIZE_BYTES,
  DOCUMENT_MAX_SIZE_MB,
  DOCUMENT_MIME_TYPE,
} from "@/constants/documents";

/**
 * Validación del archivo en el cliente, antes de tocar la red.
 * El servidor no confía en ella: el bucket impone MIME y tamaño,
 * y las actions revalidan los metadatos con registerDocumentSchema.
 */
export const pdfFileSchema = z
  .instanceof(File, { error: "Selecciona un archivo" })
  .refine((file) => file.size > 0, "El archivo está vacío")
  .refine(
    (file) =>
      file.name.toLowerCase().endsWith(DOCUMENT_EXTENSION) &&
      (file.type === "" || file.type === DOCUMENT_MIME_TYPE),
    "Solo se admiten archivos PDF",
  )
  .refine(
    (file) => file.size <= DOCUMENT_MAX_SIZE_BYTES,
    `El archivo no puede superar los ${DOCUMENT_MAX_SIZE_MB} MB`,
  );

/** Metadatos con los que se registra un documento antes de subirlo. */
export const registerDocumentSchema = z.object({
  originalFilename: z
    .string()
    .trim()
    .min(1, "El nombre del archivo es obligatorio")
    .max(255, "El nombre del archivo es demasiado largo")
    .refine(
      (name) => name.toLowerCase().endsWith(DOCUMENT_EXTENSION),
      "Solo se admiten archivos PDF",
    ),
  mimeType: z.literal(DOCUMENT_MIME_TYPE, {
    error: "Solo se admiten archivos PDF",
  }),
  sizeBytes: z
    .number()
    .int()
    .positive("El archivo está vacío")
    .max(
      DOCUMENT_MAX_SIZE_BYTES,
      `El archivo no puede superar los ${DOCUMENT_MAX_SIZE_MB} MB`,
    ),
});

export const documentIdSchema = z.uuid();

export type RegisterDocumentInput = z.infer<typeof registerDocumentSchema>;
