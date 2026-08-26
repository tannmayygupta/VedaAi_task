import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { GradingArraySchema } from "./grading";

// Placeholder fixture — see its own "_note" field. Replace with a real captured
// Gemini response once Phase 5's final grading prompt is chosen and run for
// real. See docs/TRACKER.md Phase 5.
const fixturePath = path.join(
  process.cwd(),
  "test-fixtures",
  "sample-gemini-grading-response.json",
);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

describe("grading response fixture", () => {
  it("validates against GradingArraySchema (including the marksAwarded <= marksTotal refinement)", () => {
    const result = GradingArraySchema.safeParse(fixture.gradings);
    expect(result.success).toBe(true);
  });

  it("has at least one correct grading with full marks", () => {
    const gradings = GradingArraySchema.parse(fixture.gradings);
    expect(
      gradings.some((g) => g.correctness === "correct" && g.marksAwarded === g.marksTotal),
    ).toBe(true);
  });

  it("has at least one partial grading with marks strictly between 0 and marksTotal", () => {
    const gradings = GradingArraySchema.parse(fixture.gradings);
    expect(
      gradings.some(
        (g) => g.correctness === "partial" && g.marksAwarded > 0 && g.marksAwarded < g.marksTotal,
      ),
    ).toBe(true);
  });

  it("has at least one unanswered grading with zero marks awarded", () => {
    const gradings = GradingArraySchema.parse(fixture.gradings);
    expect(
      gradings.some((g) => g.correctness === "unanswered" && g.marksAwarded === 0),
    ).toBe(true);
  });

  it("gives every grading a non-empty feedback string", () => {
    const gradings = GradingArraySchema.parse(fixture.gradings);
    for (const g of gradings) {
      expect(g.feedback.length).toBeGreaterThan(0);
    }
  });
});
