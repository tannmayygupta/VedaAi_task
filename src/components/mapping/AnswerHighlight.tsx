"use client";

import { bboxToPercent, type NormalizedBoundingBox } from "@/lib/mapping/bboxToPercent";

export type AnswerHighlightProps = {
  boundingBox: NormalizedBoundingBox;
  label: string;
};

export function AnswerHighlight({ boundingBox, label }: AnswerHighlightProps) {
  const percent = bboxToPercent(boundingBox);

  return (
    <div
      className="absolute rounded-lg border-2 border-highlight-border bg-highlight-fill"
      style={{
        top: percent.top,
        left: percent.left,
        width: percent.width,
        height: percent.height,
      }}
    >
      <span className="absolute left-1 top-1 whitespace-nowrap rounded-md bg-success px-3 py-1 text-sm font-bold text-white">
        {label}
      </span>
    </div>
  );
}
