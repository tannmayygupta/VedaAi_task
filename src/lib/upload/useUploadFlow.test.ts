import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useUploadFlow } from "./useUploadFlow";
import { validateFiles } from "../validation/fileValidation";

vi.mock("../validation/fileValidation", () => ({
  validateFiles: vi.fn(() => ({ valid: true })),
}));

function makeFile(name = "file.pdf") {
  return new File(["content"], name, { type: "application/pdf" });
}

describe("useUploadFlow", () => {
  beforeEach(() => {
    vi.mocked(validateFiles).mockReset();
    vi.mocked(validateFiles).mockReturnValue({ valid: true });
  });

  it("starts with both slots empty and mapping disabled", () => {
    const { result } = renderHook(() => useUploadFlow());
    expect(result.current.slots.questionPaper).toEqual({ files: [], error: null });
    expect(result.current.slots.answerSheet).toEqual({ files: [], error: null });
    expect(result.current.canStartMapping).toBe(false);
  });

  it("keeps mapping disabled when only one slot is filled", () => {
    const { result } = renderHook(() => useUploadFlow());
    act(() => {
      result.current.selectFiles("questionPaper", [makeFile("paper.pdf")]);
    });
    expect(result.current.slots.questionPaper.files).toHaveLength(1);
    expect(result.current.canStartMapping).toBe(false);
  });

  it("enables mapping once both slots have valid files", () => {
    const { result } = renderHook(() => useUploadFlow());
    act(() => {
      result.current.selectFiles("questionPaper", [makeFile("paper.pdf")]);
    });
    act(() => {
      result.current.selectFiles("answerSheet", [makeFile("answer.pdf")]);
    });
    expect(result.current.canStartMapping).toBe(true);
  });

  it("rejects an invalid selection, sets the error, and leaves files empty", () => {
    vi.mocked(validateFiles).mockReturnValueOnce({ valid: false, reason: "too-large" });
    const { result } = renderHook(() => useUploadFlow());
    act(() => {
      result.current.selectFiles("questionPaper", [makeFile("huge.pdf")]);
    });
    expect(result.current.slots.questionPaper).toEqual({ files: [], error: "too-large" });
    expect(result.current.canStartMapping).toBe(false);
  });

  it("resets a slot back to empty via removeFiles, disabling mapping again", () => {
    const { result } = renderHook(() => useUploadFlow());
    act(() => {
      result.current.selectFiles("questionPaper", [makeFile("paper.pdf")]);
    });
    act(() => {
      result.current.selectFiles("answerSheet", [makeFile("answer.pdf")]);
    });
    expect(result.current.canStartMapping).toBe(true);

    act(() => {
      result.current.removeFiles("questionPaper");
    });
    expect(result.current.slots.questionPaper).toEqual({ files: [], error: null });
    expect(result.current.canStartMapping).toBe(false);
  });
});
