import { describe, expect, it } from "vitest";
import { AnswerRegionSchema, AnswerRegionArraySchema } from "./answerRegion";

function makeRegion(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "r1",
    pageIndex: 0,
    boundingBox: { yMin: 100, xMin: 100, yMax: 200, xMax: 200 },
    transcribedText: "The answer is 42.",
    detectedLabel: "Q2",
    matchedQuestionId: "q2",
    matchConfidence: 0.9,
    continuesFromRegionId: null,
    ...overrides,
  };
}

describe("AnswerRegionSchema", () => {
  it("parses a fully valid AnswerRegion", () => {
    const result = AnswerRegionSchema.safeParse(makeRegion());
    expect(result.success).toBe(true);
  });

  it("rejects a boundingBox where yMax <= yMin", () => {
    const result = AnswerRegionSchema.safeParse(
      makeRegion({ boundingBox: { yMin: 200, xMin: 100, yMax: 200, xMax: 300 } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a boundingBox where xMax <= xMin", () => {
    const result = AnswerRegionSchema.safeParse(
      makeRegion({ boundingBox: { yMin: 100, xMin: 300, yMax: 200, xMax: 300 } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects matchConfidence outside 0..1", () => {
    expect(AnswerRegionSchema.safeParse(makeRegion({ matchConfidence: 1.5 })).success).toBe(false);
    expect(AnswerRegionSchema.safeParse(makeRegion({ matchConfidence: -0.1 })).success).toBe(false);
  });

  it("accepts null for detectedLabel, matchedQuestionId, and continuesFromRegionId", () => {
    const result = AnswerRegionSchema.safeParse(
      makeRegion({ detectedLabel: null, matchedQuestionId: null, continuesFromRegionId: null }),
    );
    expect(result.success).toBe(true);
  });
});

describe("AnswerRegionArraySchema", () => {
  it("accepts an array where continuesFromRegionId correctly references another region's id", () => {
    const result = AnswerRegionArraySchema.safeParse([
      makeRegion({ id: "r1", continuesFromRegionId: null }),
      makeRegion({ id: "r2", continuesFromRegionId: "r1" }),
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects an array where continuesFromRegionId references a nonexistent id", () => {
    const result = AnswerRegionArraySchema.safeParse([
      makeRegion({ id: "r1", continuesFromRegionId: null }),
      makeRegion({ id: "r2", continuesFromRegionId: "does-not-exist" }),
    ]);
    expect(result.success).toBe(false);
  });
});
