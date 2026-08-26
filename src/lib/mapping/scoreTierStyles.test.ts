import { describe, expect, it } from "vitest";
import { getScoreTierClasses } from "./scoreTierStyles";
import type { ScoreTier } from "@/lib/schemas/grading";

describe("getScoreTierClasses", () => {
  it("returns success-tinted classes for full", () => {
    expect(getScoreTierClasses("full")).toEqual({
      background: "bg-success-tint",
      text: "text-success",
    });
  });

  it("returns warning-tinted classes for partial", () => {
    expect(getScoreTierClasses("partial")).toEqual({
      background: "bg-warning-tint",
      text: "text-warning",
    });
  });

  it("returns danger-tinted classes for zero", () => {
    expect(getScoreTierClasses("zero")).toEqual({
      background: "bg-danger-tint",
      text: "text-danger",
    });
  });

  it("returns neutral/disabled classes for unanswered", () => {
    expect(getScoreTierClasses("unanswered")).toEqual({
      background: "bg-surface-off-white-20",
      text: "text-surface-disabled",
    });
  });

  it("has a defined, non-empty entry for every ScoreTier value", () => {
    const tiers: ScoreTier[] = ["full", "partial", "zero", "unanswered"];
    for (const tier of tiers) {
      const classes = getScoreTierClasses(tier);
      expect(classes.background.length).toBeGreaterThan(0);
      expect(classes.text.length).toBeGreaterThan(0);
    }
  });
});
