import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

const cropAnswerRegionsMock = vi.fn();
vi.mock("./cropAnswerRegions", () => ({
  cropAnswerRegions: (...args: unknown[]) => cropAnswerRegionsMock(...args),
}));

const { useHandwritingCrossCheck } = await import("./useHandwritingCrossCheck");

function makeRegion(overrides: Partial<AnswerRegion> & { id: string }): AnswerRegion {
  return {
    pageIndex: 0,
    boundingBox: { yMin: 0, xMin: 0, yMax: 100, xMax: 100 },
    transcribedText: "42",
    detectedLabel: null,
    matchedQuestionId: "q1",
    matchConfidence: 0.9,
    continuesFromRegionId: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  cropAnswerRegionsMock.mockReset();
});

describe("useHandwritingCrossCheck", () => {
  it("stays idle when there are no regions", () => {
    const { result } = renderHook(() => useHandwritingCrossCheck(["sheet.pdf"], []));
    expect(result.current.status).toBe("idle");
    expect(cropAnswerRegionsMock).not.toHaveBeenCalled();
  });

  it("settles into done with an empty mismatch set when GPT agrees with Gemini on everything", async () => {
    cropAnswerRegionsMock.mockResolvedValueOnce([{ regionId: "r1", dataUrl: "data:image/png;base64,AAAA" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ regionId: "r1", gptTranscription: "42", agrees: true }] }),
      }),
    );

    const { result } = renderHook(() =>
      useHandwritingCrossCheck(["sheet.pdf"], [makeRegion({ id: "r1" })]),
    );

    expect(result.current.status).toBe("checking");
    await waitFor(() => expect(result.current.status).toBe("done"));
    if (result.current.status !== "done") throw new Error("expected done");
    expect(result.current.mismatchedRegionIds.size).toBe(0);
  });

  it("flags a region as mismatched when GPT disagrees with Gemini", async () => {
    cropAnswerRegionsMock.mockResolvedValueOnce([{ regionId: "r1", dataUrl: "data:image/png;base64,AAAA" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ regionId: "r1", gptTranscription: "completely different", agrees: false }],
        }),
      }),
    );

    const { result } = renderHook(() =>
      useHandwritingCrossCheck(["sheet.pdf"], [makeRegion({ id: "r1" })]),
    );

    await waitFor(() => expect(result.current.status).toBe("done"));
    if (result.current.status !== "done") throw new Error("expected done");
    expect(result.current.mismatchedRegionIds.has("r1")).toBe(true);
  });

  it("settles into done with no mismatches when there is nothing to crop", async () => {
    cropAnswerRegionsMock.mockResolvedValueOnce([]);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useHandwritingCrossCheck(["sheet.pdf"], [makeRegion({ id: "r1" })]),
    );

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("settles into error when the cross-check request fails, without throwing", async () => {
    cropAnswerRegionsMock.mockResolvedValueOnce([{ regionId: "r1", dataUrl: "data:image/png;base64,AAAA" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "OpenAI is down" }),
      }),
    );

    const { result } = renderHook(() =>
      useHandwritingCrossCheck(["sheet.pdf"], [makeRegion({ id: "r1" })]),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    if (result.current.status !== "error") throw new Error("expected error");
    expect(result.current.message).toBe("OpenAI is down");
  });
});
