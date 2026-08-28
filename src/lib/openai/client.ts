import OpenAI from "openai";

export const DEFAULT_OPENAI_MODEL = "gpt-4o";

export type CallOpenAiJsonParams = {
  instructions: string;
  userText: string;
  /** Base64 data URLs, in order — the model is asked to reference them by this order. */
  images?: string[];
  /**
   * Whole files (PDF or image) as base64 data URIs, sent via the Responses
   * API's `input_file` content type — used for the Gemini-failover path,
   * which needs to hand the model the entire question paper/answer sheet,
   * not per-region crops like the handwriting cross-check does.
   */
  files?: { dataUri: string; filename: string }[];
  responseJsonSchema: Record<string, unknown>;
  responseSchemaName: string;
  model?: string;
};

/**
 * Makes a single OpenAI Responses API call requesting structured JSON output
 * (via Structured Outputs / json_schema) and returns the PARSED (not yet
 * schema-validated — that's the caller's job, see
 * @/lib/gemini/withSchemaValidation, reused here since it's provider-agnostic)
 * JSON value. Mirrors @/lib/gemini/client.ts's shape for consistency.
 */
export async function callOpenAiJson(params: CallOpenAiJsonParams): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const client = new OpenAI({ apiKey });

  const content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image_url: string; detail: "high" }
    | { type: "input_file"; file_data: string; filename: string }
  > = [{ type: "input_text", text: params.userText }];
  for (const [index, imageUrl] of (params.images ?? []).entries()) {
    content.push({ type: "input_text", text: `Image ${index}:` });
    content.push({ type: "input_image", image_url: imageUrl, detail: "high" });
  }
  for (const file of params.files ?? []) {
    content.push({ type: "input_file", file_data: file.dataUri, filename: file.filename });
  }

  const response = await client.responses.create({
    model: params.model ?? DEFAULT_OPENAI_MODEL,
    instructions: params.instructions,
    input: [{ role: "user", content }],
    text: {
      format: {
        type: "json_schema",
        name: params.responseSchemaName,
        schema: params.responseJsonSchema,
        strict: true,
      },
    },
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("OpenAI response contained no text");
  }
  return JSON.parse(text);
}
