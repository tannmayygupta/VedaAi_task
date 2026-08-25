import { describe, expect, it } from "vitest";
import { GradingSchema, summarizeGradings, scoreTier, type Grading } from "./grading";

function makeGrading(overrides: Partial<Grading> = {}): Grading {
  return {
    questionId: "q1",
    marksAwarded: 2,
    marksTotal: 2,
    correctness: "correct",
    feedback: "Nicely done.",
    ...overrides,
  };
}

describe("GradingSchema", () => {
  it("parses a valid grading", () => {
    expect(GradingSchema.safeParse(makeGrading()).success).toBe(true);
  });

  it("rejects marksAwarded greater than marksTotal", () => {
    const result = GradingSchema.safeParse(makeGrading({ marksAwarded: 5, marksTotal: 2 }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid correctness value", () => {
    const result = GradingSchema.safeParse({
      ...makeGrading(),
      correctness: "excellent",
    });
    expect(result.success).toBe(false);
  });
});

describe("summarizeGradings", () => {
  it("sums totals, computes percentage, and counts unanswered", () => {
    const gradings: Grading[] = [
      makeGrading({ questionId: "q1", marksAwarded: 2, marksTotal: 2, correctness: "correct" }),
      makeGrading({ questionId: "q2", marksAwarded: 0, marksTotal: 2, correctness: "unanswered" }),
      makeGrading({ questionId: "q3", marksAwarded: 3, marksTotal: 5, correctness: "partial" }),
    ];

    expect(summarizeGradings(gradings)).toEqual({
      totalAwarded: 5,
      totalPossible: 9,
      percentage: 56,
      unansweredCount: 1,
    });
  });

  it("returns zeroed summary for an empty array without dividing by zero", () => {
    expect(summarizeGradings([])).toEqual({
      totalAwarded: 0,
      totalPossible: 0,
      percentage: 0,
      unansweredCount: 0,
    });
  });
});

describe("scoreTier", () => {
  it("returns 'full' for full marks", () => {
    expect(scoreTier({ marksAwarded: 2, marksTotal: 2, correctness: "correct" })).toBe("full");
  });

  it("returns 'zero' for zero marks on an answered question", () => {
    expect(scoreTier({ marksAwarded: 0, marksTotal: 2, correctness: "incorrect" })).toBe("zero");
  });

  it("returns 'partial' for marks in between", () => {
    expect(scoreTier({ marksAwarded: 1, marksTotal: 2, correctness: "partial" })).toBe("partial");
  });

  it("returns 'unanswered' regardless of marks when correctness is unanswered", () => {
    expect(scoreTier({ marksAwarded: 0, marksTotal: 2, correctness: "unanswered" })).toBe(
      "unanswered",
    );
  });
});
