import { describe, expect, it, vi, beforeEach } from "vitest";

const callOpenAiJsonMock = vi.fn();
vi.mock("@/lib/openai/client", () => ({
  callOpenAiJson: (...args: unknown[]) => callOpenAiJsonMock(...args),
}));

// Real schema, similarity, and withSchemaValidation modules are used as-is —
// only the OpenAI call itself (the real I/O boundary) is mocked.

const { POST } = await import("./route");

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/cross-check-handwriting", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const ONE_CROP_REQUEST = {
  crops: [
    { regionId: "r1", dataUrl: "data:image/png;base64,AAAA", geminiTranscription: "42" },
  ],
};

describe("POST /api/cross-check-handwriting", () => {
  beforeEach(() => {
    callOpenAiJsonMock.mockReset();
  });

  it("returns 400 when the request body doesn't match the schema", async () => {
    const response = await POST(makeRequest({ crops: [] }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await POST(makeRequest("not-json"));
    expect(response.status).toBe(400);
  });

  it("returns agrees:true when GPT's transcription matches Gemini's", async () => {
    callOpenAiJsonMock.mockResolvedValueOnce({ transcriptions: [{ index: 0, transcription: "42" }] });

    const response = await POST(makeRequest(ONE_CROP_REQUEST));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.results).toEqual([{ regionId: "r1", gptTranscription: "42", agrees: true }]);
  });

  it("returns agrees:false when GPT's transcription genuinely differs from Gemini's", async () => {
    callOpenAiJsonMock.mockResolvedValueOnce({
      transcriptions: [{ index: 0, transcription: "The mitochondria is the powerhouse" }],
    });

    const response = await POST(makeRequest(ONE_CROP_REQUEST));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.results).toEqual([
      { regionId: "r1", gptTranscription: "The mitochondria is the powerhouse", agrees: false },
    ]);
  });

  it("maps multiple crops back to the correct regionId by index, not by order of the response array", async () => {
    const request = {
      crops: [
        { regionId: "r1", dataUrl: "data:image/png;base64,AAAA", geminiTranscription: "Delhi" },
        { regionId: "r2", dataUrl: "data:image/png;base64,BBBB", geminiTranscription: "Mumbai" },
      ],
    };
    // Model returns them out of order — index must still map correctly.
    callOpenAiJsonMock.mockResolvedValueOnce({
      transcriptions: [
        { index: 1, transcription: "Mumbai" },
        { index: 0, transcription: "Delhi" },
      ],
    });

    const response = await POST(makeRequest(request));
    const json = await response.json();
    expect(json.results).toContainEqual({ regionId: "r1", gptTranscription: "Delhi", agrees: true });
    expect(json.results).toContainEqual({ regionId: "r2", gptTranscription: "Mumbai", agrees: true });
  });

  it("retries once and succeeds when the first model response is malformed", async () => {
    callOpenAiJsonMock
      .mockResolvedValueOnce({ transcriptions: [{ bogus: true }] })
      .mockResolvedValueOnce({ transcriptions: [{ index: 0, transcription: "42" }] });

    const response = await POST(makeRequest(ONE_CROP_REQUEST));
    expect(response.status).toBe(200);
    expect(callOpenAiJsonMock).toHaveBeenCalledTimes(2);
  });

  it("returns 502 when the model response is malformed on both attempts", async () => {
    callOpenAiJsonMock.mockResolvedValue({ transcriptions: [{ bogus: true }] });

    const response = await POST(makeRequest(ONE_CROP_REQUEST));
    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json.code).toBe("malformed-response");
  });

  it("returns 502 with a normalized error when the OpenAI call itself throws (e.g. missing API key)", async () => {
    // withSchemaValidation catches attempt() throwing internally and returns
    // {ok: false}, same as extract-questions/route.ts — there is no separate
    // pre-call I/O step here (unlike fetchBlobFile there) for an error to
    // reach this route's own outer catch, so this surfaces as 502 too.
    callOpenAiJsonMock.mockRejectedValueOnce(new Error("OPENAI_API_KEY is not set"));

    const response = await POST(makeRequest(ONE_CROP_REQUEST));
    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json.error).toMatch(/OPENAI_API_KEY/);
  });

  it("ignores an out-of-range index from the model rather than crashing", async () => {
    callOpenAiJsonMock.mockResolvedValueOnce({
      transcriptions: [{ index: 5, transcription: "irrelevant" }],
    });

    const response = await POST(makeRequest(ONE_CROP_REQUEST));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.results).toEqual([]);
  });
});
