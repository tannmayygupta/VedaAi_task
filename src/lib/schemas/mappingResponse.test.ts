import { describe, expect, it } from "vitest";
import { buildMappingResponseSchema } from "./mappingResponse";
import type { AnswerRegion } from "./answerRegion";
import type { Grading } from "./grading";

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

function makeGrading(overrides: Partial<Grading> & { questionId: string }): Grading {
  return {
    marksAwarded: 1,
    marksTotal: 1,
    correctness: "correct",
    feedback: "Good answer.",
    ...overrides,
  };
}

describe("buildMappingResponseSchema", () => {
  it("accepts a response with exactly one grading per question id", () => {
    const schema = buildMappingResponseSchema(["q1", "q2"]);
    const result = schema.safeParse({
      regions: [makeRegion({ id: "r1", matchedQuestionId: "q1" })],
      gradings: [makeGrading({ questionId: "q1" }), makeGrading({ questionId: "q2" })],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty regions array", () => {
    const schema = buildMappingResponseSchema(["q1"]);
    const result = schema.safeParse({
      regions: [],
      gradings: [makeGrading({ questionId: "q1" })],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a response missing a grading for one question", () => {
    const schema = buildMappingResponseSchema(["q1", "q2"]);
    const result = schema.safeParse({
      regions: [],
      gradings: [makeGrading({ questionId: "q1" })],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a response with an extra grading for a question id that wasn't requested", () => {
    const schema = buildMappingResponseSchema(["q1"]);
    const result = schema.safeParse({
      regions: [],
      gradings: [makeGrading({ questionId: "q1" }), makeGrading({ questionId: "q3" })],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a response with a duplicate grading for the same question id", () => {
    const schema = buildMappingResponseSchema(["q1", "q2"]);
    const result = schema.safeParse({
      regions: [],
      gradings: [
        makeGrading({ questionId: "q1" }),
        makeGrading({ questionId: "q1" }),
      ],
    });
    expect(result.success).toBe(false);
  });
});
