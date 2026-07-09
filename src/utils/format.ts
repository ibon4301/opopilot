const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;

/** Formatea bytes en la unidad más legible: 1536 → "1,5 KB". */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: value >= 10 || exponent === 0 ? 0 : 1,
  }).format(value)} ${BYTE_UNITS[exponent]}`;
}

/** Formatea una fecha ISO en formato corto: "9 jul 2026". */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Formatea una fecha ISO con hora: "9 jul 2026, 10:30". */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
