import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchBlobFileMock = vi.fn();
vi.mock("@/lib/gemini/fetchBlobFile", () => ({
  fetchBlobFile: (...args: unknown[]) => fetchBlobFileMock(...args),
}));

const callGeminiJsonMock = vi.fn();
vi.mock("@/lib/gemini/client", () => ({
  callGeminiJson: (...args: unknown[]) => callGeminiJsonMock(...args),
}));

// Real schemas, prompt module, error helpers, and withSchemaValidation are used
// as-is (not mocked) so this test exercises the route's actual wiring, only
// mocking the two real I/O boundaries: the Blob fetch and the Gemini call.

const { POST } = await import("./route");

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/extract-questions", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const VALID_QUESTIONS = [
  {
    id: "q1",
    number: "1",
    subpart: null,
    displayLabel: "1",
    text: "What is the powerhouse of the cell?",
    marksTotal: null,
    pageIndex: 0,
    order: 0,
  },
];

describe("POST /api/extract-questions", () => {
  beforeEach(() => {
    fetchBlobFileMock.mockReset();
    callGeminiJsonMock.mockReset();
    fetchBlobFileMock.mockResolvedValue({
      bytes: new ArrayBuffer(0),
      mimeType: "application/pdf",
      sizeBytes: 0,
    });
  });

  it("returns 400 when blobUrl is missing", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await POST(makeRequest("not-json"));
    expect(response.status).toBe(400);
  });

  it("returns 200 with a validated questions array on a well-formed model response", async () => {
    callGeminiJsonMock.mockResolvedValueOnce({ questions: VALID_QUESTIONS });

    const response = await POST(makeRequest({ blobUrl: "https://blob.example/qp.pdf" }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.questions).toEqual(VALID_QUESTIONS);
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(1);
  });

  it("retries once and succeeds when the first model response is malformed", async () => {
    callGeminiJsonMock
      .mockResolvedValueOnce({ questions: [{ bogus: true }] })
      .mockResolvedValueOnce({ questions: VALID_QUESTIONS });

    const response = await POST(makeRequest({ blobUrl: "https://blob.example/qp.pdf" }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.questions).toEqual(VALID_QUESTIONS);
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(2);
  });

  it("returns 502 when the model response is malformed on both attempts", async () => {
    callGeminiJsonMock.mockResolvedValue({ questions: [{ bogus: true }] });

    const response = await POST(makeRequest({ blobUrl: "https://blob.example/qp.pdf" }));
    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json.code).toBe("malformed-response");
    expect(callGeminiJsonMock).toHaveBeenCalledTimes(2);
  });

  it("returns 500 with malformed-response when the model returns questions out of printed order", async () => {
    const outOfOrder = [
      { ...VALID_QUESTIONS[0], id: "q1", number: "1", displayLabel: "1", order: 0 },
      { ...VALID_QUESTIONS[0], id: "q3", number: "3", displayLabel: "3", order: 2 },
      { ...VALID_QUESTIONS[0], id: "q2", number: "2", displayLabel: "2", order: 1 },
    ];
    callGeminiJsonMock.mockResolvedValueOnce({ questions: outOfOrder });

    const response = await POST(makeRequest({ blobUrl: "https://blob.example/qp.pdf" }));
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.code).toBe("malformed-response");
  });

  it("returns 500 with the normalized error code when fetchBlobFile rejects", async () => {
    fetchBlobFileMock.mockReset();
    fetchBlobFileMock.mockRejectedValueOnce(new Error("blob not found"));

    const response = await POST(makeRequest({ blobUrl: "https://blob.example/missing.pdf" }));
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.code).toBe("unreadable-file");
  });
});
