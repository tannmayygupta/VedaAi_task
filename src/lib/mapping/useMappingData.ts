"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/schemas/question";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";
import type { Grading } from "@/lib/schemas/grading";
import type { MappingSummary } from "@/lib/mapping/mappingSummary";

export type MappingData = {
  questions: Question[];
  regions: AnswerRegion[];
  gradings: Grading[];
  summary: MappingSummary;
};

export type MappingDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MappingData };

/**
 * Fetches the full pipeline result for the mapping screen: first extracts
 * questions from the question-paper blob, then (using those questions)
 * extracts+maps+grades answers from the answer-sheet blob. Runs once per
 * distinct (questionPaperUrl, answerSheetUrl) pair; re-runs automatically if
 * either URL changes.
 */
export function useMappingData(
  questionPaperUrl: string,
  answerSheetUrl: string,
): MappingDataState {
  const [state, setState] = useState<MappingDataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cancelled) {
        setState({ status: "loading" });
      }
      try {
        const qRes = await fetch("/api/extract-questions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ blobUrl: questionPaperUrl }),
        });
        const qJson = await qRes.json();
        if (!qRes.ok) {
          throw new Error(qJson.error ?? "Failed to extract questions");
        }
        const questions: Question[] = qJson.questions;

        const aRes = await fetch("/api/extract-and-map-answers", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ blobUrl: answerSheetUrl, questions }),
        });
        const aJson = await aRes.json();
        if (!aRes.ok) {
          throw new Error(aJson.error ?? "Failed to extract and map answers");
        }

        if (!cancelled) {
          setState({
            status: "ready",
            data: {
              questions,
              regions: aJson.regions,
              gradings: aJson.gradings,
              summary: aJson.summary,
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [questionPaperUrl, answerSheetUrl]);

  return state;
}
