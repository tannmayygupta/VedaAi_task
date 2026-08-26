import { describe, expect, it } from "vitest";
import { buildMappingSummary, formatMappingSummary } from "./mappingSummary";
import type { Grading } from "@/lib/schemas/grading";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

function makeGrading(overrides: Partial<Grading> & { questionId: string }): Grading {
  return {
    marksAwarded: 0,
    marksTotal: 2,
    correctness: "correct",
    feedback: "",
    ...overrides,
  };
}

function makeRegion(overrides: Partial<AnswerRegion> & { id: string }): AnswerRegion {
  return {
    pageIndex: 0,
    boundingBox: { yMin: 0, xMin: 0, yMax: 10, xMax: 10 },
    transcribedText: "",
    detectedLabel: null,
    matchedQuestionId: null,
    matchConfidence: 1,
    continuesFromRegionId: null,
    ...overrides,
  };
}

describe("buildMappingSummary", () => {
  it("combines grading totals with the unmatched region count and total question count", () => {
    const gradings: Grading[] = [
      makeGrading({ questionId: "q1", marksAwarded: 2, marksTotal: 2, correctness: "correct" }),
      makeGrading({ questionId: "q2", marksAwarded: 0, marksTotal: 3, correctness: "unanswered" }),
      makeGrading({ questionId: "q3", marksAwarded: 1, marksTotal: 2, correctness: "partial" }),
    ];
    const regions: AnswerRegion[] = [
      makeRegion({ id: "r1", matchedQuestionId: "q1" }),
      makeRegion({ id: "r2", matchedQuestionId: "q3" }),
      makeRegion({ id: "r3", matchedQuestionId: null }),
    ];

    const summary = buildMappingSummary(gradings, regions);

    expect(summary.totalAwarded).toBe(3);
    expect(summary.totalPossible).toBe(7);
    expect(summary.percentage).toBe(Math.round((3 / 7) * 100));
    expect(summary.unansweredCount).toBe(1);
    expect(summary.unmatchedRegionCount).toBe(1);
    expect(summary.totalQuestionCount).toBe(3);
  });
});

describe("formatMappingSummary", () => {
  it("omits unanswered/unmatched clauses when both counts are 0", () => {
    const text = formatMappingSummary({
      totalAwarded: 18,
      totalPossible: 25,
      percentage: 72,
      unansweredCount: 0,
      unmatchedRegionCount: 0,
      totalQuestionCount: 10,
    });
    expect(text).toBe("18/25 (72%)");
  });

  it("includes both clauses when both counts are positive", () => {
    const text = formatMappingSummary({
      totalAwarded: 18,
      totalPossible: 25,
      percentage: 72,
      unansweredCount: 2,
      unmatchedRegionCount: 3,
      totalQuestionCount: 10,
    });
    expect(text).toBe("18/25 (72%) · 2 unanswered · 3 unmatched answers");
  });

  it("uses singular phrasing for exactly 1 unmatched answer", () => {
    const text = formatMappingSummary({
      totalAwarded: 10,
      totalPossible: 10,
      percentage: 100,
      unansweredCount: 0,
      unmatchedRegionCount: 1,
      totalQuestionCount: 5,
    });
    expect(text).toBe("10/10 (100%) · 1 unmatched answer");
  });

  it("uses plural phrasing for 2+ unmatched answers", () => {
    const text = formatMappingSummary({
      totalAwarded: 10,
      totalPossible: 10,
      percentage: 100,
      unansweredCount: 0,
      unmatchedRegionCount: 2,
      totalQuestionCount: 5,
    });
    expect(text).toBe("10/10 (100%) · 2 unmatched answers");
  });
});
