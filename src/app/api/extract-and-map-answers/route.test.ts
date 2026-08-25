import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchBlobFileMock = vi.fn();

vi.mock("@/lib/gemini/fetchBlobFile", () => ({
  fetchBlobFile: (...args: unknown[]) => fetchBlobFileMock(...args),
}));

vi.mock("@/lib/errors", () => {
  class PipelineError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    PipelineError,
    normalizeError: (error: unknown, fallbackCode = "unknown") =>
      error instanceof PipelineError
        ? error
        : new PipelineError(error instanceof Error ? error.message : String(error), fallbackCode),
    pipelineErrorToResponseBody: (error: InstanceType<typeof PipelineError>) => ({
      error: error.message,
      code: error.code,
    }),
  };
});

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/extract-and-map-answers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/extract-and-map-answers", () => {
  beforeEach(() => {
    fetchBlobFileMock.mockReset();
  });

  it("returns 400 when blobUrl is missing", async () => {
    const response = await POST(makeRequest({ questions: [] }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when questions is missing or not an array", async () => {
    const response = await POST(makeRequest({ blobUrl: "https://blob.example/file.pdf" }));
    expect(response.status).toBe(400);

    const response2 = await POST(
      makeRequest({ blobUrl: "https://blob.example/file.pdf", questions: "not-an-array" }),
    );
    expect(response2.status).toBe(400);
  });

  it("returns 200 with mapped regions for a valid request with questions", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });

    const questions = [
      {
        id: "q1",
        number: "1",
        subpart: null,
        displayLabel: "1",
        text: "Sample question",
        marksTotal: 2,
        pageIndex: 0,
        order: 0,
      },
    ];

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.regions)).toBe(true);
    expect(json.regions[0].matchedQuestionId).toBe("q1");
  });

  it("returns 200 with an empty regions array when questions is empty", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: [] }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.regions).toEqual([]);
  });

  it("returns 500 when fetchBlobFile rejects", async () => {
    fetchBlobFileMock.mockRejectedValueOnce(new Error("blob fetch failed"));

    const questions = [
      {
        id: "q1",
        number: "1",
        subpart: null,
        displayLabel: "1",
        text: "Sample question",
        marksTotal: null,
        pageIndex: 0,
        order: 0,
      },
    ];

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions }),
    );
    expect(response.status).toBe(500);
  });
});
