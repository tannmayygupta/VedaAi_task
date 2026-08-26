import { describe, expect, it, vi, beforeEach } from "vitest";

const { getDocumentMock, workerOptions } = vi.hoisted(() => ({
  getDocumentMock: vi.fn(),
  workerOptions: { workerSrc: "" },
}));

vi.mock("pdfjs-dist", () => ({
  getDocument: getDocumentMock,
  GlobalWorkerOptions: workerOptions,
}));

describe("getPdfDocument", () => {
  beforeEach(() => {
    // The module guards worker setup behind a one-time internal flag, so
    // reset modules each test to get a fresh instance of that guard.
    vi.resetModules();
    getDocumentMock.mockReset();
    workerOptions.workerSrc = "";
    getDocumentMock.mockReturnValue({ promise: Promise.resolve({ numPages: 1 }) });
  });

  it("sets the worker source to the copied public asset", async () => {
    const { getPdfDocument } = await import("./pdfjs");
    await getPdfDocument("https://blob.example/answer-sheet.pdf");
    expect(workerOptions.workerSrc).toBe("/pdf.worker.min.mjs");
  });

  it("passes a string source as { url }", async () => {
    const { getPdfDocument } = await import("./pdfjs");
    await getPdfDocument("https://blob.example/answer-sheet.pdf");
    expect(getDocumentMock).toHaveBeenCalledWith({ url: "https://blob.example/answer-sheet.pdf" });
  });

  it("passes a Uint8Array source as { data }", async () => {
    const { getPdfDocument } = await import("./pdfjs");
    const bytes = new Uint8Array([1, 2, 3]);
    await getPdfDocument(bytes);
    expect(getDocumentMock).toHaveBeenCalledWith({ data: bytes });
  });

  it("resolves to the loaded document", async () => {
    const { getPdfDocument } = await import("./pdfjs");
    const doc = await getPdfDocument("https://blob.example/answer-sheet.pdf");
    expect(doc).toEqual({ numPages: 1 });
  });
});
