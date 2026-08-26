"use client";

import { useState } from "react";
import { QuestionCard } from "./QuestionCard";
import { SummaryBanner } from "./SummaryBanner";
import { scoreTier, type Grading } from "@/lib/schemas/grading";
import { buildMappingSummary } from "@/lib/mapping/mappingSummary";
import type { Question } from "@/lib/schemas/question";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

export type QuestionListPanelProps = {
  questions: Question[];
  gradings: Grading[];
  regions: AnswerRegion[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
};

export function QuestionListPanel({
  questions,
  gradings,
  regions,
  onSelectQuestion,
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

  return (
    <div className="flex h-full flex-col gap-4">
      <SummaryBanner
        summary={summary}
        allExpanded={allExpanded}
        onToggleExpandAll={handleToggleExpandAll}
      />
      <div className="flex flex-col gap-3 overflow-y-auto">
        {questions.map((question) => {
          const grading = gradings.find((g) => g.questionId === question.id);
          const tier = grading ? scoreTier(grading) : "unanswered";
          const scoreLabel =
            !grading || tier === "unanswered"
              ? "Unanswered"
              : `${grading.marksAwarded} / ${grading.marksTotal}`;

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
            />
          );
        })}
      </div>
    </div>
  );
}
