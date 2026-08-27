"use client";

import { ChevronDown, ChevronUp, TriangleAlert } from "lucide-react";
import type { ScoreTier } from "@/lib/schemas/grading";
import { getScoreTierClasses } from "@/lib/mapping/scoreTierStyles";
import { Tooltip } from "./Tooltip";

export const LOW_CONFIDENCE_TOOLTIP =
  "Helps the teacher know where to double-check the AI's work instead of blindly trusting it.";

export const HANDWRITING_MISMATCH_TOOLTIP =
  "Our two AI readers disagreed on this handwriting — please double-check.";

export type QuestionCardProps = {
  displayLabel: string;
  subpartLetter?: string;
  questionText: string;
  scoreLabel: string;
  scoreTier: ScoreTier;
  feedback: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  needsReview?: boolean;
  /** Overrides the default low-confidence tooltip text (e.g. for a handwriting cross-check mismatch). */
  reviewTooltip?: string;
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
  needsReview = false,
  reviewTooltip = LOW_CONFIDENCE_TOOLTIP,
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

        <div className="min-w-0 flex-1 break-words text-base text-ink-primary">{questionText}</div>

        <div className={`rounded-full px-3 py-1 text-base font-bold ${background} ${text}`}>
          {scoreLabel}
        </div>

        {needsReview && (
          <Tooltip label={reviewTooltip}>
            <span className="flex items-center gap-1 rounded-full bg-warning-tint px-2 py-1 text-xs font-bold text-warning">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              Verify
            </span>
          </Tooltip>
        )}

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
        <div className="flex w-full flex-col gap-[10px] rounded-lg bg-surface-off-white px-4 py-6">
          <p className="font-bold text-ink-primary">AI Feedback</p>
          <p className="text-sm tracking-[-0.04em] text-ink-primary">{feedback}</p>
        </div>
      )}
    </div>
  );
}
