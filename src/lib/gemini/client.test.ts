import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
    return { models: { generateContent: generateContentMock } };
  }),
}));

import { callGeminiJson, DEFAULT_GEMINI_MODEL } from "./client";
import { GoogleGenAI } from "@google/genai";

describe("callGeminiJson", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    generateContentMock.mockReset();
    vi.mocked(GoogleGenAI).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves to the parsed JSON from the response text", async () => {
    generateContentMock.mockResolvedValue({ text: '{"foo":"bar"}' });

    const result = await callGeminiJson({
      parts: [{ text: "hello" }],
      responseJsonSchema: { type: "object" },
    });

    expect(result).toEqual({ foo: "bar" });
  });

  it("calls generateContent with the default model and correct config when no model override is given", async () => {
    generateContentMock.mockResolvedValue({ text: "{}" });
    const schema = { type: "object", properties: {} };

    await callGeminiJson({ parts: [{ text: "hi" }], responseJsonSchema: schema });

    expect(generateContentMock).toHaveBeenCalledWith({
      model: DEFAULT_GEMINI_MODEL,
      contents: [{ text: "hi" }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    });
  });

  it("calls generateContent with a custom model when provided", async () => {
    generateContentMock.mockResolvedValue({ text: "{}" });

    await callGeminiJson({
      parts: [{ text: "hi" }],
      responseJsonSchema: {},
      model: "gemini-custom",
    });

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-custom" }),
    );
  });

  it("rejects when the response has no text", async () => {
    generateContentMock.mockResolvedValue({ text: undefined });

    await expect(
      callGeminiJson({ parts: [{ text: "hi" }], responseJsonSchema: {} }),
    ).rejects.toThrow();
  });

  it("rejects when the response text isn't valid JSON", async () => {
    generateContentMock.mockResolvedValue({ text: "not valid json" });

    await expect(
      callGeminiJson({ parts: [{ text: "hi" }], responseJsonSchema: {} }),
    ).rejects.toThrow();
  });

  it("rejects before constructing the client when GEMINI_API_KEY is unset", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.mocked(GoogleGenAI).mockClear();

    await expect(
      callGeminiJson({ parts: [{ text: "hi" }], responseJsonSchema: {} }),
    ).rejects.toThrow(/GEMINI_API_KEY/);

    expect(GoogleGenAI).not.toHaveBeenCalled();
    expect(generateContentMock).not.toHaveBeenCalled();
  });
});
