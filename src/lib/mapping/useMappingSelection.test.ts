import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMappingSelection } from "./useMappingSelection";
import type { Question } from "@/lib/schemas/question";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    number: "1",
    subpart: null,
    displayLabel: "1",
    text: "Sample question",
    marksTotal: null,
    pageIndex: 0,
    order: 0,
    ...overrides,
  };
}

function makeRegion(overrides: Partial<AnswerRegion> & { id: string }): AnswerRegion {
  return {
    pageIndex: 0,
    boundingBox: { yMin: 0, xMin: 0, yMax: 10, xMax: 10 },
    transcribedText: "",
    detectedLabel: null,
    matchedQuestionId: null,
    matchConfidence: 1,
    continuesFromRegionId: null,
    ...overrides,
  };
}

const questions: Question[] = [
  makeQuestion({ id: "q1", order: 0 }),
  makeQuestion({ id: "q2", order: 1 }), // unanswered
  makeQuestion({ id: "q3", order: 2 }), // multi-page
];

const regions: AnswerRegion[] = [
  makeRegion({ id: "r1", pageIndex: 0, matchedQuestionId: "q1" }),
  makeRegion({ id: "unmatched-1", pageIndex: 2, matchedQuestionId: null }),
  makeRegion({ id: "r3a", pageIndex: 1, matchedQuestionId: "q3", continuesFromRegionId: null }),
  makeRegion({ id: "r3b", pageIndex: 2, matchedQuestionId: "q3", continuesFromRegionId: "r3a" }),
];

describe("useMappingSelection", () => {
  it("has an empty initial state", () => {
    const { result } = renderHook(() => useMappingSelection(questions, regions));
    expect(result.current.selectedQuestionId).toBeNull();
    expect(result.current.activeRegions).toEqual([]);
  });

  it("selects a single-region question and jumps to its page", () => {
    const { result } = renderHook(() => useMappingSelection(questions, regions));
    act(() => result.current.selectQuestion("q1"));
    expect(result.current.activeRegions.map((r) => r.id)).toEqual(["r1"]);
    expect(result.current.currentPageIndex).toBe(0);
  });

  it("flags hasNoAnswer for a question with zero regions", () => {
    const { result } = renderHook(() => useMappingSelection(questions, regions));
    act(() => result.current.selectQuestion("q2"));
    expect(result.current.hasNoAnswer).toBe(true);
    expect(result.current.activeRegions).toEqual([]);
  });

  it("returns every region in a multi-page chain when selecting that question", () => {
    const { result } = renderHook(() => useMappingSelection(questions, regions));
    act(() => result.current.selectQuestion("q3"));
    const ids = result.current.activeRegions.map((r) => r.id).sort();
    expect(ids).toEqual(["r3a", "r3b"]);
  });

  it("selecting an unmatched region clears the selected question", () => {
    const { result } = renderHook(() => useMappingSelection(questions, regions));
    act(() => result.current.selectQuestion("q1"));
    act(() => result.current.selectUnmatchedRegion("unmatched-1"));
    expect(result.current.selectedQuestionId).toBeNull();
    expect(result.current.activeRegions.map((r) => r.id)).toEqual(["unmatched-1"]);
    expect(result.current.currentPageIndex).toBe(2);
  });

  it("clearSelection resets both selection ids without touching currentPageIndex", () => {
    const { result } = renderHook(() => useMappingSelection(questions, regions));
    act(() => result.current.selectQuestion("q3"));
    act(() => result.current.goToPage(1));
    act(() => result.current.clearSelection());
    expect(result.current.selectedQuestionId).toBeNull();
    expect(result.current.activeRegions).toEqual([]);
    expect(result.current.currentPageIndex).toBe(1);
  });

  it("goToPage/nextPage/prevPage update currentPageIndex", () => {
    const { result } = renderHook(() => useMappingSelection(questions, regions));
    act(() => result.current.goToPage(2));
    expect(result.current.currentPageIndex).toBe(2);
    act(() => result.current.nextPage());
    expect(result.current.currentPageIndex).toBe(3);
    act(() => result.current.prevPage());
    act(() => result.current.prevPage());
    expect(result.current.currentPageIndex).toBe(1);
  });
});
