import { extractText, getDocumentProxy } from "unpdf";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

/**
 * Extrae el texto de un PDF página a página con unpdf (motor PDF.js de
 * Mozilla empaquetado para servidores, sin workers ni dependencias
 * nativas). El texto conserva los saltos de línea originales (`hasEOL`),
 * que el limpiador usa para reconstruir párrafos.
 */
export async function extractPdfPages(
  data: Uint8Array,
): Promise<{ pageCount: number; pages: ExtractedPage[] }> {
  const pdf = await getDocumentProxy(data);
  const { totalPages, text } = await extractText(pdf, { mergePages: false });

  return {
    pageCount: totalPages,
    pages: text.map((pageText, index) => ({
      pageNumber: index + 1,
      text: pageText,
    })),
  };
}
