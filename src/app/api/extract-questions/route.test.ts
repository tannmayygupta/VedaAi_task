import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchBlobFileMock = vi.fn();
vi.mock("@/lib/gemini/fetchBlobFile", () => ({
  fetchBlobFile: (...args: unknown[]) => fetchBlobFileMock(...args),
}));

class MockPipelineError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

const normalizeErrorMock = vi.fn((error: unknown, fallbackCode = "unknown") => {
  if (error instanceof MockPipelineError) return error;
  return new MockPipelineError(error instanceof Error ? error.message : "Unknown error", fallbackCode);
});
const pipelineErrorToResponseBodyMock = vi.fn((error: MockPipelineError) => ({
  error: error.message,
  code: error.code,
}));

vi.mock("@/lib/errors", () => ({
  PipelineError: MockPipelineError,
  normalizeError: (...args: [unknown, string?]) => normalizeErrorMock(...args),
  pipelineErrorToResponseBody: (...args: [MockPipelineError]) => pipelineErrorToResponseBodyMock(...args),
}));

vi.mock("@/lib/schemas/question", () => ({
  QuestionArraySchema: {
    safeParse: (data: unknown) => ({ success: true, data }),
  },
}));

// Import after mocks are registered so the route picks up the mocked modules.
const { POST } = await import("./route");

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/extract-questions", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/extract-questions", () => {
  beforeEach(() => {
    fetchBlobFileMock.mockReset();
    normalizeErrorMock.mockClear();
    pipelineErrorToResponseBodyMock.mockClear();
  });

  it("returns 400 when blobUrl is missing", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await POST(makeRequest("not-json"));
    expect(response.status).toBe(400);
  });

  it("returns 200 with a questions array when fetchBlobFile succeeds", async () => {
    fetchBlobFileMock.mockResolvedValueOnce({
      bytes: new ArrayBuffer(0),
      mimeType: "application/pdf",
      sizeBytes: 0,
    });

    const response = await POST(makeRequest({ blobUrl: "https://blob.example/qp.pdf" }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.questions)).toBe(true);
    expect(json.questions.length).toBeGreaterThan(0);
  });

  it("returns 500 with the normalized error code when fetchBlobFile rejects", async () => {
    fetchBlobFileMock.mockRejectedValueOnce(new Error("blob not found"));

    const response = await POST(makeRequest({ blobUrl: "https://blob.example/missing.pdf" }));
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.code).toBe("unreadable-file");
  });
});
