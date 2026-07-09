import type { ReactNode } from "react";

export type PropsWithClassName<P = unknown> = P & { className?: string };

export type PropsWithChildren<P = unknown> = P & { children: ReactNode };

/**
 * Resultado discriminado de toda Server Action: error ya traducido
 * y listo para mostrarse en la UI.
 */
export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };
