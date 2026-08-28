import { describe, expect, it } from "vitest";
import { resolveMarksTotal, normalizeMarksAwarded, DEFAULT_MARKS_WHEN_UNSTATED } from "./defaultMarks";

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

describe("normalizeMarksAwarded", () => {
  it("leaves an already-whole-or-half value unchanged", () => {
    expect(normalizeMarksAwarded(1.5, 2)).toBe(1.5);
    expect(normalizeMarksAwarded(2, 2)).toBe(2);
    expect(normalizeMarksAwarded(0, 2)).toBe(0);
  });

  it("rounds an off-step value to the nearest half mark", () => {
    expect(normalizeMarksAwarded(1.3, 2)).toBe(1.5);
    expect(normalizeMarksAwarded(1.2, 2)).toBe(1);
    expect(normalizeMarksAwarded(0.24, 2)).toBe(0);
  });

  it("clamps to marksTotal after rounding, never exceeding it", () => {
    expect(normalizeMarksAwarded(1.9, 2)).toBe(2);
    expect(normalizeMarksAwarded(4.8, 5)).toBe(5);
  });

  it("clamps negative values to 0", () => {
    expect(normalizeMarksAwarded(-0.3, 2)).toBe(0);
  });
});
