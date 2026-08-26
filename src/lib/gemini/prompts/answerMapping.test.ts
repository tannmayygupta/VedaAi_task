import { describe, expect, it } from "vitest";
import { ANSWER_MAPPING_SYSTEM_PROMPT, buildAnswerMappingUserPrompt } from "./answerMapping";
import type { Question } from "@/lib/schemas/question";

describe("answer mapping prompt", () => {
  it("covers every PRD §7 matching-priority rule", () => {
    expect(ANSWER_MAPPING_SYSTEM_PROMPT).toMatch(/label/i);
    expect(ANSWER_MAPPING_SYSTEM_PROMPT).toMatch(/sequential/i);
    expect(ANSWER_MAPPING_SYSTEM_PROMPT).toMatch(/semantic/i);
    expect(ANSWER_MAPPING_SYSTEM_PROMPT).toMatch(/null/i);
  });

  it("explicitly instructs against force-matching vague/unlabeled content", () => {
    expect(ANSWER_MAPPING_SYSTEM_PROMPT).toMatch(/not be force-matched|do not force-match/i);
  });

  it("explicitly covers multi-page continuation linking", () => {
    expect(ANSWER_MAPPING_SYSTEM_PROMPT).toMatch(/continuesFromRegionId/);
    expect(ANSWER_MAPPING_SYSTEM_PROMPT).toMatch(/continuation/i);
  });

  it("embeds the given questions as JSON in the user prompt", () => {
    const questions: Question[] = [
      {
        id: "q1",
        number: "1",
        subpart: null,
        displayLabel: "1",
        text: "Sample question",
        marksTotal: null,
        pageIndex: 0,
        order: 0,
      },
    ];
    const prompt = buildAnswerMappingUserPrompt(questions);
    expect(prompt).toContain("Sample question");
    expect(prompt).toContain('"id":"q1"');
  });
});
