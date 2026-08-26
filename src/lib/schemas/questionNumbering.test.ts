import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertPrintedOrder, formatDisplayLabel, generateQuestionId } from "./questionNumbering";

const GROUND_TRUTH_FIXTURES = [
  "question-paper-basic.ground-truth.json",
  "question-paper-complex.ground-truth.json",
  "question-paper-marks.ground-truth.json",
];

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

  it.each(GROUND_TRUTH_FIXTURES)(
    "passes for the real ground-truth question order in %s",
    (filename) => {
      const raw = readFileSync(
        join(process.cwd(), "test-fixtures", filename),
        "utf-8",
      );
      const groundTruthQuestions: unknown[] = JSON.parse(raw);
      // Ground-truth fixtures store questions in printed order (their array
      // index IS the expected order) but don't carry an `order` field
      // themselves — assign one the same way the extraction route would.
      const withOrder = groundTruthQuestions.map((q, order) => ({ ...(q as object), order }));

      expect(() => assertPrintedOrder(withOrder)).not.toThrow();
    },
  );

  it("catches a real regression: shuffling a real ground-truth fixture's order throws", () => {
    const raw = readFileSync(
      join(process.cwd(), "test-fixtures", "question-paper-basic.ground-truth.json"),
      "utf-8",
    );
    const groundTruthQuestions: unknown[] = JSON.parse(raw);
    const withOrder = groundTruthQuestions.map((q, order) => ({ ...(q as object), order }));
    // Swap two entries to simulate the model returning them out of printed order.
    [withOrder[1], withOrder[2]] = [withOrder[2], withOrder[1]];

    expect(() => assertPrintedOrder(withOrder)).toThrow(/not in ascending/);
  });
});
