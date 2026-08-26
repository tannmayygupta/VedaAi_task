import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePdfDocument } from "./usePdfDocument";

const { getPdfDocumentMock } = vi.hoisted(() => ({ getPdfDocumentMock: vi.fn() }));

vi.mock("@/lib/pdf/pdfjs", () => ({
  getPdfDocument: getPdfDocumentMock,
}));

describe("usePdfDocument", () => {
  beforeEach(() => {
    getPdfDocumentMock.mockClear();
  });

  it("starts in loading state, then resolves to ready with the page count and a getPage delegate", async () => {
    const fakePage = { pageNumber: 1 };
    const fakePdf = { numPages: 4, getPage: vi.fn(async () => fakePage) };
    getPdfDocumentMock.mockResolvedValueOnce(fakePdf);

    const { result } = renderHook(() => usePdfDocument("https://blob.example/answer-sheet.pdf"));

    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("ready"));
    if (result.current.status !== "ready") throw new Error("expected ready state");
    expect(result.current.numPages).toBe(4);

    const page = await result.current.getPage(2);
    expect(page).toBe(fakePage);
    expect(fakePdf.getPage).toHaveBeenCalledWith(2);
  });

  it("moves to an error state when loading fails", async () => {
    getPdfDocumentMock.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => usePdfDocument("https://blob.example/broken.pdf"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    if (result.current.status !== "error") throw new Error("expected error state");
    expect(result.current.message).toBe("network error");
  });

  it("stays in loading state and does not call getPdfDocument when url is null", () => {
    const { result } = renderHook(() => usePdfDocument(null));
    expect(result.current.status).toBe("loading");
    expect(getPdfDocumentMock).not.toHaveBeenCalled();
  });
});
