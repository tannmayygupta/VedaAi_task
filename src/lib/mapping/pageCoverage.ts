/**
 * Guards against the run-to-run variance observed in real testing (see
 * docs/DECISIONS.md "Post-mitigation re-audit of the OpenAI failover"): both
 * providers can, on a dense multi-page answer sheet, stop segmenting partway
 * through and still confidently grade the un-reviewed later questions as if
 * they'd been read. A gap this large between the last page actually covered
 * and the document's real last page is the detectable symptom of that.
 */
export const COVERAGE_GAP_THRESHOLD = 2;

export function maxPageCovered(regions: { pageIndex: number }[]): number {
  return regions.length === 0 ? -1 : Math.max(...regions.map((r) => r.pageIndex));
}

/**
 * Like maxPageCovered, but ignores any pageIndex outside [0, totalPages) —
 * a single hallucinated out-of-range page index (the real "Page 16 of 15"
 * bug this session, see docs/DECISIONS.md) must not be able to make the
 * coverage check think the model reached the end of the document when the
 * rest of its regions show it didn't.
 */
export function maxValidPageCovered(regions: { pageIndex: number }[], totalPages: number): number {
  const validIndices = regions.map((r) => r.pageIndex).filter((p) => p >= 0 && p < totalPages);
  return validIndices.length === 0 ? -1 : Math.max(...validIndices);
}

/**
 * `totalPages: null` means the page count couldn't be determined (e.g. the
 * fetched bytes didn't parse as a PDF) — treated as "can't check", not as a
 * failure, since it's an orthogonal, rare case unrelated to model accuracy.
 */
export function hasFullPageCoverage(
  regions: { pageIndex: number }[],
  totalPages: number | null,
): boolean {
  if (totalPages === null || totalPages <= 1) {
    return true;
  }
  return totalPages - 1 - maxValidPageCovered(regions, totalPages) <= COVERAGE_GAP_THRESHOLD;
}
