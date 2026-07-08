import type { ReactNode } from "react";

export type PropsWithClassName<P = unknown> = P & { className?: string };

export type PropsWithChildren<P = unknown> = P & { children: ReactNode };
