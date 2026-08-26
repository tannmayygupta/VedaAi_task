import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchBlobFileMock = vi.fn();
const callGeminiJsonMock = vi.fn();

vi.mock("@/lib/gemini/fetchBlobFile", () => ({
  fetchBlobFile: (...args: unknown[]) => fetchBlobFileMock(...args),
}));

vi.mock("@/lib/gemini/client", () => ({
  callGeminiJson: (...args: unknown[]) => callGeminiJsonMock(...args),
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

const sampleQuestions = [
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

function sampleRegion(overrides: Record<string, unknown> = {}) {
  return {
    id: "r1",
    pageIndex: 0,
    boundingBox: { yMin: 100, xMin: 100, yMax: 300, xMax: 800 },
    transcribedText: "Sample answer",
    detectedLabel: "Q1",
    matchedQuestionId: "q1",
    matchConfidence: 0.9,
    continuesFromRegionId: null,
    ...overrides,
  };
}

function sampleGrading(overrides: Record<string, unknown> = {}) {
  return {
    questionId: "q1",
    marksAwarded: 2,
    marksTotal: 2,
    correctness: "correct",
    feedback: "Correct and complete answer.",
    ...overrides,
  };
}

describe("POST /api/extract-and-map-answers", () => {
  beforeEach(() => {
    fetchBlobFileMock.mockReset();
    callGeminiJsonMock.mockReset();
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

  it("returns 400 when questions don't match the Question schema", async () => {
    const response = await POST(
      makeRequest({
        blobUrl: "https://blob.example/file.pdf",
        questions: [{ id: "q1" }],
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 with mapped regions and gradings for a well-formed model response", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValueOnce({
      regions: [sampleRegion()],
      gradings: [sampleGrading()],
    });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.regions).toHaveLength(1);
    expect(json.regions[0].matchedQuestionId).toBe("q1");
    expect(json.gradings).toHaveLength(1);
    expect(json.gradings[0].questionId).toBe("q1");
    expect(json.summary.totalAwarded).toBe(2);
    expect(json.summary.totalPossible).toBe(2);
  });

  it("returns 502 when gradings are missing a required question id", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValue({ regions: [sampleRegion()], gradings: [] });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(502);
  });

  it("nulls out matchedQuestionId if the model references a question id that wasn't provided", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValueOnce({
      regions: [sampleRegion({ matchedQuestionId: "does-not-exist", matchConfidence: 0.9 })],
      gradings: [sampleGrading()],
    });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.regions[0].matchedQuestionId).toBeNull();
    expect(json.regions[0].matchConfidence).toBe(0);
  });

  it("retries once on a malformed response and succeeds on the second attempt", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock
      .mockResolvedValueOnce({ regions: [{ id: "r1" }], gradings: [] }) // malformed
      .mockResolvedValueOnce({ regions: [sampleRegion()], gradings: [sampleGrading()] }); // valid retry

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(200);
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(2);
  });

  it("returns 502 when the model response is malformed on both attempts", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValue({ regions: [{ id: "r1" }], gradings: [] });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(502);
  });

  it("returns 200 with empty regions/gradings when there are no questions", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValueOnce({ regions: [], gradings: [] });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: [] }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.regions).toEqual([]);
    expect(json.gradings).toEqual([]);
    expect(json.summary.totalQuestionCount).toBe(0);
  });

  it("returns 500 when fetchBlobFile rejects", async () => {
    fetchBlobFileMock.mockRejectedValueOnce(new Error("blob fetch failed"));

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(500);
  });
});
