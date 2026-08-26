import { summarizeGradings, type Grading, type GradingSummary } from "@/lib/schemas/grading";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

export type MappingSummary = GradingSummary & {
  unmatchedRegionCount: number;
  totalQuestionCount: number;
};

export function buildMappingSummary(gradings: Grading[], regions: AnswerRegion[]): MappingSummary {
  const gradingSummary = summarizeGradings(gradings);
  const unmatchedRegionCount = regions.filter((r) => r.matchedQuestionId === null).length;
  return {
    ...gradingSummary,
    unmatchedRegionCount,
    totalQuestionCount: gradings.length,
  };
}

/**
 * Human-readable one-line summary string for the mapping screen's summary
 * banner, e.g. "18/25 (72%) · 2 unanswered · 1 unmatched answer" — omits the
 * unanswered/unmatched clauses entirely when their count is 0, and singular/
 * plural correctly ("1 unmatched answer" vs "2 unmatched answers").
 */
export function formatMappingSummary(summary: MappingSummary): string {
  const parts = [`${summary.totalAwarded}/${summary.totalPossible} (${summary.percentage}%)`];
  if (summary.unansweredCount > 0) {
    parts.push(`${summary.unansweredCount} unanswered`);
  }
  if (summary.unmatchedRegionCount > 0) {
    parts.push(
      `${summary.unmatchedRegionCount} unmatched answer${summary.unmatchedRegionCount === 1 ? "" : "s"}`,
    );
  }
  return parts.join(" · ");
}
