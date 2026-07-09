/**
 * Contrato provider-agnostic de generación de preguntas: el servicio
 * depende de esta interfaz, nunca de un proveedor concreto. Cambiar de
 * proveedor = añadir un archivo que implemente GenerateQuestionsFn.
 */

/** Error con mensaje pensado para mostrarse al usuario tal cual. */
export class TestGenerationError extends Error {}

/**
 * Recibe el prompt ya construido y devuelve el texto crudo del modelo
 * (JSON sin parsear: el parseo y la validación son responsabilidad de
 * validators.ts, para que el reintento sea uniforme entre proveedores).
 */
export type GenerateQuestionsFn = (prompt: string) => Promise<string>;
