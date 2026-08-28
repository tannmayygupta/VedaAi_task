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

/**
 * Rounds a model-reported `marksAwarded` to the nearest whole or half mark
 * (0, 0.5, 1, 1.5, ...) and clamps it to `[0, marksTotal]`. The grading
 * prompt already instructs the model to round this way, but nothing in
 * `GradingSchema` enforced it — same rationale as recomputing `id`/
 * `displayLabel` server-side rather than trusting the model's own
 * formatting (see docs/DECISIONS.md, Phase 3). Normalizing here instead of
 * adding a hard schema constraint (e.g. `.multipleOf(0.5)`) means an
 * off-step value gets silently corrected rather than failing the whole
 * response and burning a retry.
 */
export function normalizeMarksAwarded(marksAwarded: number, marksTotal: number): number {
  const rounded = Math.round(marksAwarded * 2) / 2;
  return Math.min(Math.max(rounded, 0), marksTotal);
}
