import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { QuestionArraySchema } from "./question";

// This fixture is a REAL captured Gemini response (see its own "_note" field) —
// captured during Phase 3 real-API verification. See docs/TRACKER.md Phase 3.
const fixturePath = path.join(process.cwd(), "test-fixtures", "sample-gemini-question-response.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

describe("question extraction response fixture", () => {
  it("validates against QuestionArraySchema", () => {
    const result = QuestionArraySchema.safeParse(fixture.questions);
    expect(result.success).toBe(true);
  });

  it("is in ascending printed order", () => {
    const result = QuestionArraySchema.parse(fixture.questions);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].order).toBeGreaterThan(result[i - 1].order);
    }
  });

  it("keeps a sub-parted question as separate entries, not merged", () => {
    const result = QuestionArraySchema.parse(fixture.questions);
    const subparts = result.filter((q) => q.number === "5");
    expect(subparts).toHaveLength(3);
    expect(subparts.map((q) => q.subpart).sort()).toEqual(["a", "b", "c"]);
  });

  it("preserves both a null and a non-null marksTotal correctly typed", () => {
    const result = QuestionArraySchema.parse(fixture.questions);
    const withNullMarks = result.find((q) => q.marksTotal === null);
    const withMarks = result.find((q) => typeof q.marksTotal === "number");
    expect(withNullMarks).toBeDefined();
    expect(withMarks).toBeDefined();
    expect(withMarks?.marksTotal).not.toBe("null");
    expect(withMarks?.marksTotal).not.toBe(0);
  });
});
