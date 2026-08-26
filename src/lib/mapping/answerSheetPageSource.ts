export type AnswerSheetPageSource = { kind: "image"; url: string };

export const PDF_URL_PATTERN = /\.pdf($|\?)/i;

/**
 * Given the ordered list of image Blob URLs that make up the answer sheet
 * and the 0-indexed page to display, returns how the mapping screen should
 * render that page. PDF URLs are handled separately by AnswerSheetViewer via
 * pdfjs-dist (see PdfPageCanvas/usePdfDocument) — callers should check
 * `PDF_URL_PATTERN` before calling this, since it only ever resolves images.
 */
export function resolveAnswerSheetPageSource(
  blobUrls: string[],
  pageIndex: number,
): AnswerSheetPageSource | null {
  const url = blobUrls[pageIndex];
  return url ? { kind: "image", url } : null;
}

/** Total page count for the given image blob URL list. */
export function getAnswerSheetPageCount(blobUrls: string[]): number {
  return blobUrls.length;
}
