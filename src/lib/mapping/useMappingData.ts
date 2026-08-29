"use client";

import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/lib/schemas/question";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";
import type { Grading } from "@/lib/schemas/grading";
import type { MappingSummary } from "@/lib/mapping/mappingSummary";
import { readMappingCache, writeMappingCache } from "@/lib/mapping/mappingResultCache";

export type MappingData = {
  questions: Question[];
  regions: AnswerRegion[];
  gradings: Grading[];
  summary: MappingSummary;
  /** True when the mapping call (after its own one automatic retry) still
   * didn't reach near the answer sheet's last page — see
   * docs/DECISIONS.md "Post-mitigation re-audit of the OpenAI failover". */
  incompleteCoverage: boolean;
};

export type MappingDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MappingData };

export type UseMappingDataResult = MappingDataState & { retry: () => void };

/**
 * Fetches the full pipeline result for the mapping screen: first extracts
 * questions from the question-paper blob, then (using those questions)
 * extracts+maps+grades answers from the answer-sheet blob. Runs once per
 * distinct (questionPaperUrl, answerSheetUrl) pair; re-runs automatically if
 * either URL changes, or on demand via `retry()` — which re-fetches against
 * the same already-uploaded blob URLs rather than requiring the user to
 * re-select/re-upload files (see docs/DECISIONS.md).
 *
 * If the question-extraction call succeeds but the answer-extraction call
 * fails, the whole result settles to `{status: "error"}` — the successfully
 * fetched questions are discarded rather than shown as a half-populated
 * mapping screen (PRD §10: partial extraction = full failure).
 *
 * A successful result is cached in sessionStorage per (questionPaperUrl,
 * answerSheetUrl) pair, so refreshing the mapping screen doesn't lose it and
 * re-run the whole AI pipeline. `retry()` always bypasses the cache — a
 * retry means the previous attempt was bad, so it should never just
 * re-serve a stale cached result.
 */
export function useMappingData(
  questionPaperUrl: string,
  answerSheetUrl: string,
): UseMappingDataResult {
  const [state, setState] = useState<MappingDataState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (retryCount === 0) {
        const cached = readMappingCache(questionPaperUrl, answerSheetUrl);
        if (cached) {
          if (!cancelled) {
            setState({ status: "ready", data: cached });
          }
          return;
        }
      }
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

        const data: MappingData = {
          questions,
          regions: aJson.regions,
          gradings: aJson.gradings,
          summary: aJson.summary,
          incompleteCoverage: aJson.incompleteCoverage ?? false,
        };
        writeMappingCache(questionPaperUrl, answerSheetUrl, data);
        if (!cancelled) {
          setState({ status: "ready", data });
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
  }, [questionPaperUrl, answerSheetUrl, retryCount]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  return { ...state, retry };
}
