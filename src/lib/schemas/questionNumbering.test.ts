import { describe, expect, it } from "vitest";
import { assertPrintedOrder, formatDisplayLabel, generateQuestionId } from "./questionNumbering";

describe("formatDisplayLabel", () => {
  it("returns just the number for a top-level question", () => {
    expect(formatDisplayLabel("11", null)).toBe("11");
  });

  it("returns 'number (subpart)' for a sub-part", () => {
    expect(formatDisplayLabel("11", "a")).toBe("11 (a)");
  });

  it("works with non-numeric numbering schemes", () => {
    expect(formatDisplayLabel("iii", null)).toBe("iii");
    expect(formatDisplayLabel("iii", "b")).toBe("iii (b)");
  });
});

describe("generateQuestionId", () => {
  it("generates a plain id for a top-level question", () => {
    expect(generateQuestionId("11", null)).toBe("q11");
  });

  it("generates a hyphenated id for a sub-part", () => {
    expect(generateQuestionId("11", "a")).toBe("q11-a");
  });

  it("strips punctuation from messy numbering", () => {
    expect(generateQuestionId("II.", null)).toBe("qii");
  });

  it("lowercases the subpart", () => {
    expect(generateQuestionId("7", "A")).toBe("q7-a");
  });
});

describe("assertPrintedOrder", () => {
  it("passes through an already-ascending list unchanged", () => {
    const input = [{ order: 0 }, { order: 1 }, { order: 2 }];
    expect(assertPrintedOrder(input)).toBe(input);
  });

  it("throws when a later item has a smaller order than an earlier one", () => {
    const input = [{ order: 0 }, { order: 2 }, { order: 1 }];
    expect(() => assertPrintedOrder(input)).toThrow(/index 2/);
  });

  it("does not throw for a single-element array", () => {
    expect(() => assertPrintedOrder([{ order: 0 }])).not.toThrow();
  });

  it("does not throw for an empty array", () => {
    expect(() => assertPrintedOrder([])).not.toThrow();
  });
});
