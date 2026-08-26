import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMappingData } from "./useMappingData";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useMappingData", () => {
  it("starts in the loading state", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    const { result } = renderHook(() => useMappingData("qp.pdf", "as.pdf"));
    expect(result.current.status).toBe("loading");
  });

  it("settles into ready with combined data on success", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [{ id: "q1" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          regions: [{ id: "r1" }],
          gradings: [{ questionId: "q1" }],
          summary: { totalAwarded: 2, totalPossible: 2 },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useMappingData("qp.pdf", "as.pdf"));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    if (result.current.status !== "ready") throw new Error("expected ready");
    expect(result.current.data.questions).toEqual([{ id: "q1" }]);
    expect(result.current.data.regions).toEqual([{ id: "r1" }]);
    expect(result.current.data.gradings).toEqual([{ questionId: "q1" }]);
  });

  it("settles into error when the first fetch fails, and never calls the second", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "bad file" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useMappingData("qp.pdf", "as.pdf"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    if (result.current.status !== "error") throw new Error("expected error");
    expect(result.current.message).toBe("bad file");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("settles into error when the second fetch fails", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: [{ id: "q1" }] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "mapping failed" }) });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useMappingData("qp.pdf", "as.pdf"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    if (result.current.status !== "error") throw new Error("expected error");
    expect(result.current.message).toBe("mapping failed");
  });

  it("chains the second call with the questions returned by the first", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [{ id: "q1", text: "Sample" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ regions: [], gradings: [], summary: {} }),
      });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useMappingData("qp.pdf", "as.pdf"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondCallBody.questions).toEqual([{ id: "q1", text: "Sample" }]);
  });
});
