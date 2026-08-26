import { describe, expect, it } from "vitest";
import {
  QUESTION_EXTRACTION_SYSTEM_PROMPT,
  buildQuestionExtractionUserPrompt,
} from "./questionExtraction";

describe("question extraction prompt", () => {
  it("covers every extraction rule from PRD §6", () => {
    expect(QUESTION_EXTRACTION_SYSTEM_PROMPT).toMatch(/order/i);
    expect(QUESTION_EXTRACTION_SYSTEM_PROMPT).toMatch(/sub-part/i);
    expect(QUESTION_EXTRACTION_SYSTEM_PROMPT).toMatch(/marksTotal/);
    expect(QUESTION_EXTRACTION_SYSTEM_PROMPT).toMatch(/null/);
    expect(QUESTION_EXTRACTION_SYSTEM_PROMPT).toMatch(/gap/i);
  });

  it("user prompt instructs zero-based order and id generation", () => {
    const prompt = buildQuestionExtractionUserPrompt();
    expect(prompt).toMatch(/order/i);
    expect(prompt).toMatch(/id/i);
  });
});
