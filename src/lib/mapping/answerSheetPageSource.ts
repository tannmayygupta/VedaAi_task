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

/**
 * Clamps a page index to a valid `[0, totalPages - 1]` range. A region's
 * `pageIndex` comes straight from the model and is occasionally wrong (a
 * real observed case: a 15-page document, one region reported pageIndex 15,
 * one past the last valid index 14) — without this, selecting that question
 * would ask pdfjs for a page that doesn't exist ("Invalid page request")
 * instead of just falling back to the nearest real page.
 */
export function clampPageIndex(pageIndex: number, totalPages: number): number {
  return Math.min(Math.max(pageIndex, 0), totalPages - 1);
}
