"use client";

import { useMemo, useState } from "react";
import { QuestionCard, LOW_CONFIDENCE_TOOLTIP, HANDWRITING_MISMATCH_TOOLTIP } from "./QuestionCard";
import { SummaryBanner } from "./SummaryBanner";
import { scoreTier, type Grading } from "@/lib/schemas/grading";
import { buildMappingSummary } from "@/lib/mapping/mappingSummary";
import { getReviewReason } from "@/lib/mapping/reviewFlag";
import { exportMappingDataAsJson } from "@/lib/mapping/exportMappingData";
import type { Question } from "@/lib/schemas/question";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

export type QuestionListPanelProps = {
  questions: Question[];
  gradings: Grading[];
  regions: AnswerRegion[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  /** Region ids the Phase 9 handwriting cross-check flagged as disagreeing (see docs/PRD.md §16). */
  mismatchedRegionIds?: ReadonlySet<string>;
};

const REVIEW_TOOLTIPS = {
  "low-confidence": LOW_CONFIDENCE_TOOLTIP,
  "handwriting-mismatch": HANDWRITING_MISMATCH_TOOLTIP,
} as const;

export function QuestionListPanel({
  questions,
  gradings,
  regions,
  onSelectQuestion,
  mismatchedRegionIds = new Set(),
}: QuestionListPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const allExpanded = expandedIds.size === questions.length && questions.length > 0;

  function handleToggleExpand(questionId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
    onSelectQuestion(questionId);
  }

  function handleToggleExpandAll() {
    setExpandedIds(allExpanded ? new Set() : new Set(questions.map((q) => q.id)));
  }

  const summary = buildMappingSummary(gradings, regions);

  const reviewReasonByQuestionId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getReviewReason>>();
    for (const region of regions) {
      const reason = getReviewReason(region, mismatchedRegionIds);
      if (reason && region.matchedQuestionId) {
        map.set(region.matchedQuestionId, reason);
      }
    }
    return map;
  }, [regions, mismatchedRegionIds]);

  function handleExportJson() {
    exportMappingDataAsJson({ questions, regions, gradings, summary });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <SummaryBanner
        summary={summary}
        allExpanded={allExpanded}
        onToggleExpandAll={handleToggleExpandAll}
        onExportJson={handleExportJson}
      />
      <div className="flex flex-col gap-3 overflow-y-auto">
        {questions.map((question) => {
          const grading = gradings.find((g) => g.questionId === question.id);
          const tier = grading ? scoreTier(grading) : "unanswered";
          const scoreLabel =
            !grading || tier === "unanswered"
              ? "Unanswered"
              : `${grading.marksAwarded} / ${grading.marksTotal}`;

          const reviewReason = reviewReasonByQuestionId.get(question.id);

          return (
            <QuestionCard
              key={question.id}
              displayLabel={question.displayLabel}
              {...(question.subpart ? { subpartLetter: question.subpart } : {})}
              questionText={question.text}
              scoreLabel={scoreLabel}
              scoreTier={tier}
              feedback={grading?.feedback ?? null}
              isExpanded={expandedIds.has(question.id)}
              onToggleExpand={() => handleToggleExpand(question.id)}
              needsReview={reviewReason !== undefined}
              {...(reviewReason ? { reviewTooltip: REVIEW_TOOLTIPS[reviewReason] } : {})}
            />
          );
        })}
      </div>
    </div>
  );
}
