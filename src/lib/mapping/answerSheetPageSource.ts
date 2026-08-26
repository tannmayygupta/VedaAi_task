export type AnswerSheetPageSource =
  | { kind: "image"; url: string }
  | { kind: "unsupported-pdf-page"; url: string };

const PDF_URL_PATTERN = /\.pdf($|\?)/i;

/**
 * Given the ordered list of Blob URLs that make up the answer sheet (either
 * multiple image URLs, one per page, OR a single PDF URL), and the 0-indexed
 * page to display, returns how the mapping screen should render that page.
 *
 * Known limitation: per-page rendering of a PDF into a displayable image is
 * not implemented (would need e.g. pdfjs-dist) — a single-PDF-URL input
 * returns "unsupported-pdf-page" for every page so the UI can show an honest
 * fallback message instead of a broken image. Multiple image URLs (the
 * common case for a photographed answer sheet) are fully supported.
 */
export function resolveAnswerSheetPageSource(
  blobUrls: string[],
  pageIndex: number,
): AnswerSheetPageSource | null {
  if (blobUrls.length === 0) return null;
  if (blobUrls.length === 1 && PDF_URL_PATTERN.test(blobUrls[0])) {
    return { kind: "unsupported-pdf-page", url: blobUrls[0] };
  }
  const url = blobUrls[pageIndex];
  return url ? { kind: "image", url } : null;
}

/**
 * Total page count for the given blob URL list, under the same rule as
 * resolveAnswerSheetPageSource: a single PDF URL is treated as exactly 1
 * "page" for navigation purposes (real per-page PDF counts aren't available
 * without rendering it) — a known limitation, not a bug.
 */
export function getAnswerSheetPageCount(blobUrls: string[]): number {
  if (blobUrls.length === 1 && PDF_URL_PATTERN.test(blobUrls[0])) {
    return 1;
  }
  return blobUrls.length;
}
