import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AnswerRegionArraySchema } from "./answerRegion";

// Placeholder fixture (see its own "_note" field) — swap for a real captured
// Gemini response once Phase 4's final mapping prompt is chosen and run for
// real. See docs/TRACKER.md Phase 4.
const fixturePath = path.join(
  process.cwd(),
  "test-fixtures",
  "sample-gemini-answer-mapping-response.json",
);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

describe("answer mapping response fixture", () => {
  it("validates against AnswerRegionArraySchema (including the continuesFromRegionId cross-check)", () => {
    const result = AnswerRegionArraySchema.safeParse(fixture.regions);
    expect(result.success).toBe(true);
  });

  it("has exactly one unmatched region", () => {
    const regions = AnswerRegionArraySchema.parse(fixture.regions);
    const unmatched = regions.filter((r) => r.matchedQuestionId === null);
    expect(unmatched).toHaveLength(1);
  });

  it("correctly links a multi-page continuation to the same matchedQuestionId as its root", () => {
    const regions = AnswerRegionArraySchema.parse(fixture.regions);
    const continuation = regions.find((r) => r.continuesFromRegionId !== null);
    expect(continuation).toBeDefined();
    const root = regions.find((r) => r.id === continuation!.continuesFromRegionId);
    expect(root).toBeDefined();
    expect(continuation!.matchedQuestionId).toBe(root!.matchedQuestionId);
  });

  it("has both a low-confidence and a high-confidence region, correctly typed as numbers", () => {
    const regions = AnswerRegionArraySchema.parse(fixture.regions);
    expect(regions.some((r) => typeof r.matchConfidence === "number" && r.matchConfidence < 0.6)).toBe(true);
    expect(regions.some((r) => typeof r.matchConfidence === "number" && r.matchConfidence >= 0.6)).toBe(true);
  });
});
