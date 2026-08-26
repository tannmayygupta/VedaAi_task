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
