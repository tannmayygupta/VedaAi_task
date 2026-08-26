import type { PDFDocumentProxy } from "pdfjs-dist";

let workerConfigured = false;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;
  }
  return pdfjs;
}

/**
 * Loads a PDF document via pdfjs-dist, from either a URL (answer sheet
 * viewer, fetching an already-uploaded blob) or raw bytes (upload-screen
 * page-count check, run on a File before it's ever uploaded). Client-side
 * only — pdfjs-dist needs canvas/Worker APIs that don't exist under SSR.
 */
export async function getPdfDocument(source: string | Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfjs();
  const params = typeof source === "string" ? { url: source } : { data: source };
  return pdfjs.getDocument(params).promise;
}
