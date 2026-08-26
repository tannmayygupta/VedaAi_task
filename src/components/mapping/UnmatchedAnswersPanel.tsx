"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

export type UnmatchedAnswersPanelProps = {
  unmatchedRegions: AnswerRegion[];
  onSelectRegion: (regionId: string) => void;
  selectedRegionId: string | null;
};

export function UnmatchedAnswersPanel({
  unmatchedRegions,
  onSelectRegion,
  selectedRegionId,
}: UnmatchedAnswersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (unmatchedRegions.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between rounded-lg bg-surface-off-white px-4 py-3"
      >
        <span className="font-bold text-ink-primary">
          Unmatched Answers ({unmatchedRegions.length})
        </span>
        {isOpen ? (
          <ChevronUp className="size-5 text-ink-secondary" />
        ) : (
          <ChevronDown className="size-5 text-ink-secondary" />
        )}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-1">
          {unmatchedRegions.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => onSelectRegion(region.id)}
              className={`w-full truncate rounded-md px-4 py-2 text-left text-ink-primary hover:bg-surface-off-white-20 ${
                selectedRegionId === region.id ? "bg-surface-off-white-20 font-medium" : ""
              }`}
            >
              {region.transcribedText}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
