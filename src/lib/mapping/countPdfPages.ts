import { PDFDocument } from "pdf-lib";

/**
 * Server-side page count for the coverage guardrail. A non-PDF upload (a
 * single image, never merged — see mergeFilesToPdf.ts) is always exactly one
 * page. Returns null if the bytes claim to be a PDF but don't parse as one —
 * the caller treats that as "can't check" rather than an error, since a
 * malformed page count shouldn't block an otherwise-successful mapping result.
 */
export async function countPdfPages(bytes: ArrayBuffer, mimeType: string): Promise<number | null> {
  if (mimeType !== "application/pdf") {
    return 1;
  }
  try {
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  } catch {
    return null;
  }
}
