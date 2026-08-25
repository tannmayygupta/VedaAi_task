import { GoogleGenAI } from "@google/genai";
import type { GeminiPart } from "./part";

export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

export type CallGeminiJsonParams = {
  parts: GeminiPart[];
  responseJsonSchema: unknown;
  model?: string;
};

/**
 * Makes a single Gemini call requesting structured JSON output and returns the
 * PARSED (but not yet schema-validated — that's the caller's job, see
 * withSchemaValidation.ts) JSON value. Throws if the API call fails, if no
 * text is returned, or if the returned text isn't valid JSON — callers are
 * expected to catch and normalize these via `normalizeError` from
 * `@/lib/errors` (a sibling module built by another agent).
 */
export async function callGeminiJson(params: CallGeminiJsonParams): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: params.model ?? DEFAULT_GEMINI_MODEL,
    contents: params.parts,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: params.responseJsonSchema,
    },
  });
  const text = response.text;
  if (!text) {
    throw new Error("Gemini response contained no text");
  }
  return JSON.parse(text);
}
