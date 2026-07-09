/**
 * Contrato provider-agnostic de embeddings: el servicio de documentos y
 * la búsqueda dependen de esta interfaz, nunca de un proveedor concreto.
 * Cambiar de proveedor = añadir un archivo que implemente EmbedFn.
 */

/** Error con mensaje pensado para mostrarse al usuario tal cual. */
export class EmbeddingError extends Error {}

/**
 * Uso del embedding: los proveedores que distinguen entre indexar
 * documentos y embeber consultas (Gemini) producen mejores resultados
 * de recuperación cuando se les indica.
 */
export type EmbeddingTask = "document" | "query";

/** Firma inyectable: los tests sustituyen al proveedor por un stub determinista. */
export type EmbedFn = (
  texts: string[],
  task: EmbeddingTask,
) => Promise<number[][]>;
