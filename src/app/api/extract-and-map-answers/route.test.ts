import { describe, expect, it, vi, beforeEach } from "vitest";
import { PDFDocument } from "pdf-lib";

async function makePdfBytes(pageCount: number): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([100, 100]);
  }
  const bytes = await pdf.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

const fetchBlobFileMock = vi.fn();
const callGeminiJsonMock = vi.fn();
const callOpenAiJsonMock = vi.fn();

vi.mock("@/lib/gemini/fetchBlobFile", () => ({
  fetchBlobFile: (...args: unknown[]) => fetchBlobFileMock(...args),
  isAllowedBlobUrl: () => true,
}));

vi.mock("@/lib/gemini/client", () => ({
  callGeminiJson: (...args: unknown[]) => callGeminiJsonMock(...args),
}));

vi.mock("@/lib/openai/client", () => ({
  callOpenAiJson: (...args: unknown[]) => callOpenAiJsonMock(...args),
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
    callOpenAiJsonMock.mockReset();
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
    expect(json.provider).toBe("gemini");
    expect(callOpenAiJsonMock).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI and succeeds when Gemini fails entirely", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockRejectedValue(new Error("quota exceeded"));
    callOpenAiJsonMock.mockResolvedValueOnce({
      regions: [sampleRegion()],
      gradings: [sampleGrading()],
    });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.regions[0].matchedQuestionId).toBe("q1");
    expect(json.provider).toBe("openai");
  });

  it("rounds an off-step marksAwarded to the nearest half mark instead of passing it through", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(8),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValueOnce({
      regions: [sampleRegion()],
      gradings: [sampleGrading({ marksAwarded: 1.3 })],
    });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.gradings[0].marksAwarded).toBe(1.5);
    expect(json.summary.totalAwarded).toBe(1.5);
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

  it("does not retry, and reports full coverage, when the first response already reaches the last page", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: await makePdfBytes(15),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValueOnce({
      regions: [sampleRegion({ pageIndex: 14 })],
      gradings: [sampleGrading()],
    });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    const json = await response.json();
    expect(json.incompleteCoverage).toBe(false);
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(1);
  });

  it("retries the same provider once on incomplete page coverage, and uses the improved result", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: await makePdfBytes(15),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock
      .mockResolvedValueOnce({ regions: [sampleRegion({ pageIndex: 8 })], gradings: [sampleGrading()] })
      .mockResolvedValueOnce({
        regions: [sampleRegion({ pageIndex: 8 }), sampleRegion({ id: "r2", pageIndex: 14 })],
        gradings: [sampleGrading()],
      });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    const json = await response.json();
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(2);
    // The retry call included a correction note referencing the missed pages.
    const secondCallArgs = callGeminiJsonMock.mock.calls[1][0];
    expect(JSON.stringify(secondCallArgs)).toMatch(/page 9/);
    expect(json.incompleteCoverage).toBe(false);
    expect(json.regions).toHaveLength(2);
  });

  it("reports incompleteCoverage when the retry still doesn't reach the last page", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: await makePdfBytes(15),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValue({
      regions: [sampleRegion({ pageIndex: 8 })],
      gradings: [sampleGrading()],
    });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(2);
    expect(json.incompleteCoverage).toBe(true);
  });

  it("retries OpenAI (not Gemini) when OpenAI's failover result has incomplete coverage", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: await makePdfBytes(15),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockRejectedValue(new Error("quota exceeded"));
    callOpenAiJsonMock
      .mockResolvedValueOnce({ regions: [sampleRegion({ pageIndex: 8 })], gradings: [sampleGrading()] })
      .mockResolvedValueOnce({
        regions: [sampleRegion({ pageIndex: 14 })],
        gradings: [sampleGrading()],
      });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    const json = await response.json();
    expect(json.provider).toBe("openai");
    expect(json.incompleteCoverage).toBe(false);
    expect(callOpenAiJsonMock).toHaveBeenCalledTimes(2);
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(1);
  });

  it("flags incomplete coverage even when one region has a hallucinated out-of-range pageIndex", async () => {
    // Real observed case: only 3 regions found on a 15-page sheet, but one
    // region claimed pageIndex 15 (out of range) — a naive raw-max check
    // would misread that as "reached the last page" when it clearly didn't.
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: await makePdfBytes(15),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock.mockResolvedValue({
      regions: [
        sampleRegion({ pageIndex: 0 }),
        sampleRegion({ id: "r2", pageIndex: 1 }),
        sampleRegion({ id: "r3", pageIndex: 15 }),
      ],
      gradings: [sampleGrading()],
    });

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.incompleteCoverage).toBe(true);
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the original result if the coverage retry itself throws", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: await makePdfBytes(15),
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
    callGeminiJsonMock
      .mockResolvedValueOnce({ regions: [sampleRegion({ pageIndex: 8 })], gradings: [sampleGrading()] })
      .mockRejectedValueOnce(new Error("network blip"));

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.incompleteCoverage).toBe(true);
    expect(json.regions).toHaveLength(1);
  });

  it("returns 500 when fetchBlobFile rejects", async () => {
    fetchBlobFileMock.mockRejectedValueOnce(new Error("blob fetch failed"));

    const response = await POST(
      makeRequest({ blobUrl: "https://blob.example/answer-sheet.pdf", questions: sampleQuestions }),
    );
    expect(response.status).toBe(500);
  });
});
