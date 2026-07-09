/**
 * Limpieza del texto extraído de un PDF, en pasos pequeños y
 * componibles. El objetivo no es texto perfecto sino texto estable
 * para chunking y embeddings: sin basura de codificación, con
 * párrafos reconstruidos y títulos conservados.
 */

/** Espacios exóticos → espacio normal; fuera controles y restos de codificación. */
function normalizeCharacters(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u00a0\u1680\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, " ")
    .replace(/\f/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000e-\u001f\u007f-\u009f\ufffd]/g, "");
}

/** Une palabras cortadas con guion a final de línea: "constitu-\nción" → "constitución". */
function joinHyphenatedWords(text: string): string {
  return text.replace(/([a-záéíóúüñ])-\n([a-záéíóúüñ])/gi, "$1$2");
}

/** Línea que es solo un número de página u otra basura sin contenido. */
function isJunkLine(line: string): boolean {
  return /^\d{1,4}$/.test(line) || !/[\p{L}\p{N}]/u.test(line);
}

/** Título probable: línea corta sin puntuación final, numerada o en mayúsculas. */
function looksLikeHeading(line: string): boolean {
  if (line.length > 80 || /[.,;]$/.test(line)) return false;
  const isNumbered = /^(\d+[.)]|[IVXLC]+\.)\s/.test(line);
  const letters = line.replace(/[^\p{L}]/gu, "");
  const isMostlyUppercase =
    letters.length >= 4 && letters === letters.toLocaleUpperCase("es");
  return isNumbered || isMostlyUppercase;
}

/**
 * Reconstruye párrafos: en el texto de un PDF cada línea visual termina
 * en "\n", así que un salto solo separa párrafos cuando la línea cierra
 * una frase, es un título o hay línea en blanco. El resto de saltos se
 * convierten en espacios para no trocear frases.
 */
function reflowParagraphs(text: string): string {
  const lines = text.split("\n").map((line) => line.trim());
  const parts: string[] = [];

  for (const line of lines) {
    if (line.length === 0 || isJunkLine(line)) {
      parts.push("\n\n");
      continue;
    }

    if (looksLikeHeading(line)) {
      parts.push("\n\n", line, "\n\n");
      continue;
    }

    parts.push(line, /[.:;!?]$/.test(line) ? "\n\n" : " ");
  }

  return parts.join("");
}

/** Colapsa espacios repetidos y deja como máximo una línea en blanco. */
function collapseWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const CLEANING_STEPS = [
  normalizeCharacters,
  joinHyphenatedWords,
  reflowParagraphs,
  collapseWhitespace,
];

export function cleanPdfText(text: string): string {
  return CLEANING_STEPS.reduce((current, step) => step(current), text);
}
