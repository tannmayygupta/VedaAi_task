import { describe, expect, it } from "vitest";
import { resolveMarksTotal, DEFAULT_MARKS_WHEN_UNSTATED } from "./defaultMarks";

describe("resolveMarksTotal", () => {
  it("uses the paper's stated marks when present", () => {
    expect(resolveMarksTotal({ marksTotal: 5 })).toBe(5);
  });

  it("falls back to the project-wide default when marksTotal is null", () => {
    expect(resolveMarksTotal({ marksTotal: null })).toBe(DEFAULT_MARKS_WHEN_UNSTATED);
  });

  it("treats a stated 0 as a real value, not as absent (nullish coalescing, not OR)", () => {
    expect(resolveMarksTotal({ marksTotal: 0 })).toBe(0);
  });
});
