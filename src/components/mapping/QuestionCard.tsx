"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { ScoreTier } from "@/lib/schemas/grading";
import { getScoreTierClasses } from "@/lib/mapping/scoreTierStyles";

export type QuestionCardProps = {
  displayLabel: string;
  subpartLetter?: string;
  questionText: string;
  scoreLabel: string;
  scoreTier: ScoreTier;
  feedback: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
};

function badgeContent(displayLabel: string, subpartLetter?: string): string {
  if (!subpartLetter) {
    return displayLabel;
  }
  const [bareNumber] = displayLabel.split(/[\s(]/);
  return bareNumber || displayLabel;
}

export function QuestionCard({
  displayLabel,
  subpartLetter,
  questionText,
  scoreLabel,
  scoreTier,
  feedback,
  isExpanded,
  onToggleExpand,
}: QuestionCardProps) {
  const { background, text } = getScoreTierClasses(scoreTier);

  return (
    <div
      className={`flex w-full flex-col gap-3 rounded-lg bg-surface-white p-3 ${
        isExpanded ? "border-2 border-brand-orange" : ""
      }`}
    >
      <div className="flex w-full items-center gap-4">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xl font-extrabold text-white ${
            isExpanded ? "bg-brand-orange" : "border-2 border-white/25 bg-[rgba(43,43,43,0.8)]"
          }`}
        >
          {badgeContent(displayLabel, subpartLetter)}
        </div>

        {subpartLetter && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-off-white font-bold text-ink-primary">
            {subpartLetter}.
          </div>
        )}

        <div className="flex-1 text-base text-ink-primary">{questionText}</div>

        <div className={`rounded-full px-3 py-1 text-base font-bold ${background} ${text}`}>
          {scoreLabel}
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          aria-label="Toggle question details"
          className="rounded-sm bg-surface-off-white p-1"
        >
          {isExpanded ? (
            <ChevronUp className="size-5 text-ink-primary" />
          ) : (
            <ChevronDown className="size-5 text-ink-primary" />
          )}
        </button>
      </div>

      {isExpanded && feedback && (
        <div className="flex w-full flex-col gap-2 rounded-lg bg-surface-off-white px-6 py-4">
          <p className="font-bold text-ink-primary">AI Feedback</p>
          <p className="text-sm text-ink-primary">{feedback}</p>
        </div>
      )}
    </div>
  );
}
