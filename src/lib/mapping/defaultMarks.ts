import type { Question } from "@/lib/schemas/question";

/**
 * Default marks assumed for a question whose paper didn't explicitly state a
 * mark value, per docs/PRD.md §8. This is the single source of truth for
 * this fallback — used both when telling the grading model what to assume,
 * and (if ever needed) when computing a grading summary before real grading
 * data exists.
 */
export const DEFAULT_MARKS_WHEN_UNSTATED = 2;

/**
 * Resolves the marks total to use for grading a question: the paper's own
 * stated value if present, otherwise the project-wide default.
 */
export function resolveMarksTotal(question: Pick<Question, "marksTotal">): number {
  return question.marksTotal ?? DEFAULT_MARKS_WHEN_UNSTATED;
}
