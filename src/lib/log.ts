/**
 * Log de errores en el servidor (Server Actions, route handlers).
 * El usuario recibe siempre un mensaje amigable; el detalle real
 * (código, mensaje y hint de Supabase) queda en la consola del
 * servidor, que nunca llega al cliente.
 */
export function logActionError(scope: string, error: unknown): void {
  console.error(`[action:${scope}]`, error);
}
