"use client";

import type { Grading } from "@/lib/schemas/grading";

export type GradingDebugViewProps = {
  gradings: Grading[];
  summaryLine?: string;
};

export function GradingDebugView({ gradings, summaryLine }: GradingDebugViewProps) {
  return (
    <div>
      {summaryLine && <p>{summaryLine}</p>}
      {gradings.length === 0 ? (
        <p>No gradings yet</p>
      ) : (
        <ul>
          {gradings.map((grading) => (
            <li key={grading.questionId}>
              <span>{grading.questionId}</span>{" "}
              <span>
                {grading.marksAwarded}/{grading.marksTotal}
              </span>{" "}
              <span>{grading.correctness}</span>
              <p>{grading.feedback}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
