import { describe, expect, it } from "vitest";
import { QuestionSchema, QuestionArraySchema } from "./question";

function makeValidQuestion(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "q1",
    number: "1",
    subpart: null,
    displayLabel: "1",
    text: "Which blood vessel carries blood away from the heart?",
    marksTotal: 2,
    pageIndex: 0,
    order: 0,
    ...overrides,
  };
}

describe("QuestionSchema", () => {
  it("parses a fully valid Question object", () => {
    const result = QuestionSchema.safeParse(makeValidQuestion());
    expect(result.success).toBe(true);
  });

  it("accepts subpart and marksTotal as null", () => {
    const result = QuestionSchema.safeParse(
      makeValidQuestion({ subpart: null, marksTotal: null }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts subpart set to a real value alongside a numeric marksTotal", () => {
    const result = QuestionSchema.safeParse(
      makeValidQuestion({ subpart: "a", displayLabel: "11 (a)", marksTotal: 2 }),
    );
    expect(result.success).toBe(true);
  });

  it("fails when a required field like text is missing", () => {
    const invalid = makeValidQuestion();
    delete (invalid as Record<string, unknown>).text;
    const result = QuestionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("fails when pageIndex is negative", () => {
    const result = QuestionSchema.safeParse(makeValidQuestion({ pageIndex: -1 }));
    expect(result.success).toBe(false);
  });

  it("fails when order is negative", () => {
    const result = QuestionSchema.safeParse(makeValidQuestion({ order: -1 }));
    expect(result.success).toBe(false);
  });

  it.each(["id", "number", "displayLabel", "text"])(
    "fails when %s is an empty string",
    (field) => {
      const result = QuestionSchema.safeParse(makeValidQuestion({ [field]: "" }));
      expect(result.success).toBe(false);
    },
  );
});

describe("QuestionArraySchema", () => {
  it("parses a valid array of Question objects", () => {
    const result = QuestionArraySchema.safeParse([
      makeValidQuestion({ id: "q1", order: 0 }),
      makeValidQuestion({ id: "q2", order: 1, subpart: "a", displayLabel: "2 (a)" }),
    ]);
    expect(result.success).toBe(true);
  });

  it("fails if any element in the array is invalid", () => {
    const invalidSecond = makeValidQuestion({ id: "q2", order: 1 });
    delete (invalidSecond as Record<string, unknown>).displayLabel;
    const result = QuestionArraySchema.safeParse([makeValidQuestion(), invalidSecond]);
    expect(result.success).toBe(false);
  });
});
