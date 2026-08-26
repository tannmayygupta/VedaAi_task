import type { AnswerRegion } from "@/lib/schemas/answerRegion";

export const LOW_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Returns true if this region's match is confident enough to present without
 * a "please verify" flag. A region with matchedQuestionId: null (unmatched)
 * is never flagged by this function — "unmatched" already has its own clear
 * UI treatment elsewhere in the app; this flag is specifically for a
 * MATCHED region the model wasn't very sure about, which is a different and
 * easier-to-miss risk (a plausible-looking wrong answer, presented with no
 * visible caveat).
 */
export function shouldFlagForReview(region: Pick<AnswerRegion, "matchedQuestionId" | "matchConfidence">): boolean {
  if (region.matchedQuestionId === null) {
    return false;
  }
  return region.matchConfidence < LOW_CONFIDENCE_THRESHOLD;
}

/**
 * Convenience filter: given a full list of regions, returns only the ones
 * that should be flagged for review.
 */
export function getRegionsNeedingReview(regions: AnswerRegion[]): AnswerRegion[] {
  return regions.filter(shouldFlagForReview);
}

export type ReviewReason = "low-confidence" | "handwriting-mismatch";

/**
 * Combines the pre-existing low-confidence flag with the Phase 9 handwriting
 * cross-check (docs/PRD.md §16): a region can be flagged for either reason
 * (or both — if both apply, the handwriting mismatch takes priority since a
 * "the two AI readers disagree" signal is a more concrete, actionable
 * discrepancy than a bare confidence score). `matchedQuestionId: null`
 * regions are never flagged, same as `shouldFlagForReview`.
 */
export function getReviewReason(
  region: Pick<AnswerRegion, "id" | "matchedQuestionId" | "matchConfidence">,
  mismatchedRegionIds: ReadonlySet<string>,
): ReviewReason | null {
  if (region.matchedQuestionId === null) {
    return null;
  }
  if (mismatchedRegionIds.has(region.id)) {
    return "handwriting-mismatch";
  }
  if (region.matchConfidence < LOW_CONFIDENCE_THRESHOLD) {
    return "low-confidence";
  }
  return null;
}
