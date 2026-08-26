import { z } from "zod";
import { AnswerRegionArraySchema } from "./answerRegion";
import { GradingArraySchema } from "./grading";

/**
 * Builds the combined response schema for the extract-and-map-answers route,
 * given the exact set of question ids that were sent in the request — this
 * lets the schema enforce that `gradings` covers every one of those question
 * ids exactly once (no missing questions, no extra/hallucinated ones), which
 * a schema with no knowledge of the input question list couldn't otherwise
 * check.
 */
export function buildMappingResponseSchema(questionIds: string[]) {
  const expected = new Set(questionIds);
  return z
    .object({
      regions: AnswerRegionArraySchema,
      gradings: GradingArraySchema,
    })
    .superRefine((data, ctx) => {
      const gradedIds = new Set(data.gradings.map((g) => g.questionId));

      for (const id of expected) {
        if (!gradedIds.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["gradings"],
            message: `Missing a Grading entry for question id "${id}"`,
          });
        }
      }
      for (const id of gradedIds) {
        if (!expected.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["gradings"],
            message: `Grading entry references question id "${id}" which was not in the request`,
          });
        }
      }
      if (data.gradings.length !== expected.size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gradings"],
          message: `Expected exactly ${expected.size} Grading entries (one per question), got ${data.gradings.length}`,
        });
      }
    });
}

export type MappingResponse = {
  regions: import("./answerRegion").AnswerRegion[];
  gradings: import("./grading").Grading[];
};
