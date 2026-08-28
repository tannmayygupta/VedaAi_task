"use client";

import { useCallback, useMemo, useState } from "react";
import type { Question } from "@/lib/schemas/question";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";
import { getChainForRegionId } from "./groupContinuations";

export type MappingSelectionState = {
  selectedQuestionId: string | null;
  selectedUnmatchedRegionId: string | null;
  currentPageIndex: number;
  activeRegions: AnswerRegion[];
  hasNoAnswer: boolean;
  selectQuestion: (questionId: string) => void;
  selectUnmatchedRegion: (regionId: string) => void;
  clearSelection: () => void;
  goToPage: (pageIndex: number) => void;
  nextPage: () => void;
  prevPage: () => void;
};

export function useMappingSelection(
  questions: Question[],
  regions: AnswerRegion[],
): MappingSelectionState {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedUnmatchedRegionId, setSelectedUnmatchedRegionId] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const selectQuestion = useCallback(
    (questionId: string) => {
      setSelectedQuestionId(questionId);
      setSelectedUnmatchedRegionId(null);

      const matched = regions.filter((r) => r.matchedQuestionId === questionId);
      if (matched.length > 0) {
        const firstPage = Math.min(...matched.map((r) => r.pageIndex));
        setCurrentPageIndex(firstPage);
      }
    },
    [regions],
  );

  const selectUnmatchedRegion = useCallback(
    (regionId: string) => {
      setSelectedUnmatchedRegionId(regionId);
      setSelectedQuestionId(null);

      const region = regions.find((r) => r.id === regionId);
      if (region) {
        setCurrentPageIndex(region.pageIndex);
      }
    },
    [regions],
  );

  // Collapsing the card that's currently highlighted should clear the
  // highlight (not leave it "orphaned" with no expanded card showing it) —
  // deliberately doesn't touch currentPageIndex, unlike selectQuestion/
  // selectUnmatchedRegion, since clearing isn't "go look at this."
  const clearSelection = useCallback(() => {
    setSelectedQuestionId(null);
    setSelectedUnmatchedRegionId(null);
  }, []);

  const goToPage = useCallback((pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPageIndex((p) => p + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPageIndex((p) => Math.max(0, p - 1));
  }, []);

  const activeRegions = useMemo(() => {
    if (selectedUnmatchedRegionId) {
      return regions.filter((r) => r.id === selectedUnmatchedRegionId);
    }
    if (selectedQuestionId) {
      const first = regions.find((r) => r.matchedQuestionId === selectedQuestionId);
      if (!first) {
        return [];
      }
      const chainIds = new Set(getChainForRegionId(regions, first.id));
      return regions.filter((r) => chainIds.has(r.id));
    }
    return [];
  }, [regions, selectedQuestionId, selectedUnmatchedRegionId]);

  const hasNoAnswer = useMemo(() => {
    if (!selectedQuestionId) {
      return false;
    }
    return !regions.some((r) => r.matchedQuestionId === selectedQuestionId);
  }, [regions, selectedQuestionId]);

  void questions;

  return {
    selectedQuestionId,
    selectedUnmatchedRegionId,
    currentPageIndex,
    activeRegions,
    hasNoAnswer,
    selectQuestion,
    selectUnmatchedRegion,
    clearSelection,
    goToPage,
    nextPage,
    prevPage,
  };
}
