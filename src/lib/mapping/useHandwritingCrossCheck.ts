"use client";

import { useEffect, useState } from "react";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";
import { cropAnswerRegions } from "./cropAnswerRegions";
import { expectedVisibleText } from "./handwritingSimilarity";

export type HandwritingCrossCheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "done"; mismatchedRegionIds: Set<string> }
  | { status: "error"; message: string };

/**
 * Runs the Phase 9 dual-model handwriting cross-check (docs/PRD.md §16) as a
 * background, non-blocking follow-up to the main mapping result: crops every
 * answer region client-side, sends them to GPT for an independent
 * transcription, and flags regions where the two AI readers disagreed.
 * Gemini's own transcription/matching/grading are never touched by this —
 * a mismatch only ever adds a review flag elsewhere in the UI.
 *
 * Intentionally does not affect the mapping screen's initial render: this
 * hook is only ever mounted from MappingScreen, which itself only renders
 * once Gemini's data is already available — so this check always starts
 * after first paint, never before it.
 */
export function useHandwritingCrossCheck(
  blobUrls: string[],
  regions: AnswerRegion[],
): HandwritingCrossCheckState {
  const [state, setState] = useState<HandwritingCrossCheckState>({ status: "idle" });

  // Depend on content, not array/object identity: blobUrls/regions can be a
  // fresh array reference every render (e.g. if a caller doesn't memoize),
  // and this hook's own setState calls trigger re-renders too — depending on
  // reference equality risks the effect re-firing every render, which
  // previously caused a real runaway render loop (caught by a test-suite
  // OOM crash, not by inspection).
  const blobUrlsKey = blobUrls.join("|");
  const regionsKey = regions.map((r) => `${r.id}:${r.transcribedText}`).join("|");

  useEffect(() => {
    if (regions.length === 0) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      setState({ status: "checking" });
      try {
        const crops = await cropAnswerRegions(blobUrls, regions, controller.signal);
        if (cancelled) return;
        if (crops.length === 0) {
          if (!cancelled) setState({ status: "done", mismatchedRegionIds: new Set() });
          return;
        }

        const regionById = new Map(regions.map((r) => [r.id, r]));
        const payload = {
          crops: crops.map((c) => {
            const region = regionById.get(c.regionId);
            return {
              regionId: c.regionId,
              dataUrl: c.dataUrl,
              geminiTranscription: region
                ? expectedVisibleText(region.detectedLabel, region.transcribedText)
                : "",
            };
          }),
        };

        const res = await fetch("/api/cross-check-handwriting", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Handwriting cross-check failed");
        }

        const mismatchedRegionIds = new Set<string>(
          (json.results as Array<{ regionId: string; agrees: boolean }>)
            .filter((r) => !r.agrees)
            .map((r) => r.regionId),
        );
        if (!cancelled) {
          setState({ status: "done", mismatchedRegionIds });
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
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on content (blobUrlsKey/regionsKey) instead of blobUrls/regions references, see comment above
  }, [blobUrlsKey, regionsKey]);

  return state;
}
