import { describe, expect, it } from "vitest";
import {
  shouldFlagForReview,
  getRegionsNeedingReview,
  getReviewReason,
  LOW_CONFIDENCE_THRESHOLD,
} from "./reviewFlag";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

function makeRegion(overrides: Partial<AnswerRegion> & { id: string }): AnswerRegion {
  return {
    pageIndex: 0,
    boundingBox: { yMin: 0, xMin: 0, yMax: 100, xMax: 100 },
    transcribedText: "",
    detectedLabel: null,
    matchedQuestionId: "q1",
    matchConfidence: 1,
    continuesFromRegionId: null,
    ...overrides,
  };
}

describe("shouldFlagForReview", () => {
  it("does not flag a matched region with high confidence", () => {
    expect(shouldFlagForReview({ matchedQuestionId: "q1", matchConfidence: 0.9 })).toBe(false);
  });

  it("flags a matched region with low confidence", () => {
    expect(shouldFlagForReview({ matchedQuestionId: "q1", matchConfidence: 0.3 })).toBe(true);
  });

  it("does not flag a matched region exactly at the threshold (strictly-less-than semantics)", () => {
    expect(shouldFlagForReview({ matchedQuestionId: "q1", matchConfidence: LOW_CONFIDENCE_THRESHOLD })).toBe(false);
  });

  it("never flags an unmatched region, even with low confidence", () => {
    expect(shouldFlagForReview({ matchedQuestionId: null, matchConfidence: 0.9 })).toBe(false);
    expect(shouldFlagForReview({ matchedQuestionId: null, matchConfidence: 0.1 })).toBe(false);
  });
});

describe("getRegionsNeedingReview", () => {
  it("returns only the matched, low-confidence regions from a mixed list", () => {
    const regions = [
      makeRegion({ id: "r1", matchedQuestionId: "q1", matchConfidence: 0.9 }),
      makeRegion({ id: "r2", matchedQuestionId: "q2", matchConfidence: 0.3 }),
      makeRegion({ id: "r3", matchedQuestionId: null, matchConfidence: 0.1 }),
      makeRegion({ id: "r4", matchedQuestionId: "q3", matchConfidence: 0.59 }),
    ];
    const flagged = getRegionsNeedingReview(regions);
    expect(flagged.map((r) => r.id)).toEqual(["r2", "r4"]);
  });
});

describe("getReviewReason", () => {
  it("returns null for a high-confidence, non-mismatched region", () => {
    const region = makeRegion({ id: "r1", matchedQuestionId: "q1", matchConfidence: 0.9 });
    expect(getReviewReason(region, new Set())).toBeNull();
  });

  it("returns 'low-confidence' for a matched region below the threshold with no cross-check mismatch", () => {
    const region = makeRegion({ id: "r1", matchedQuestionId: "q1", matchConfidence: 0.3 });
    expect(getReviewReason(region, new Set())).toBe("low-confidence");
  });

  it("returns 'handwriting-mismatch' when the region id is in the mismatch set, regardless of confidence", () => {
    const region = makeRegion({ id: "r1", matchedQuestionId: "q1", matchConfidence: 0.99 });
    expect(getReviewReason(region, new Set(["r1"]))).toBe("handwriting-mismatch");
  });

  it("prioritizes 'handwriting-mismatch' over 'low-confidence' when both apply", () => {
    const region = makeRegion({ id: "r1", matchedQuestionId: "q1", matchConfidence: 0.1 });
    expect(getReviewReason(region, new Set(["r1"]))).toBe("handwriting-mismatch");
  });

  it("never flags an unmatched region for either reason", () => {
    const region = makeRegion({ id: "r1", matchedQuestionId: null, matchConfidence: 0.1 });
    expect(getReviewReason(region, new Set(["r1"]))).toBeNull();
  });
});
