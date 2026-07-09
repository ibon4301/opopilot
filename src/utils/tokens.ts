/**
 * Estimación rápida de tokens (~4 caracteres por token en texto
 * occidental). Suficiente para dimensionar chunks y presupuestar
 * llamadas de embeddings en la Fase 6; el recuento exacto lo dará
 * la API del proveedor.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
