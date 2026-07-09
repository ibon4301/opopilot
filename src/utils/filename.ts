/**
 * Deriva un nombre legible para la UI a partir del nombre original del
 * archivo: quita la extensión, normaliza separadores y espacios.
 * "  tema_07-la-constitución (v2).PDF " → "tema 07 la constitución (v2)"
 */
export function toDisplayFilename(originalFilename: string): string {
  const withoutExtension = originalFilename.replace(/\.pdf$/i, "");
  const normalized = withoutExtension
    .replace(/[_\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 ? normalized.slice(0, 255) : "Documento";
}
