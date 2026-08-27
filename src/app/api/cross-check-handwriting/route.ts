export const runtime = "nodejs";
// See extract-and-map-answers/route.ts — a 15-page answer sheet can produce
// 20-25+ regions, all batched into one GPT call; same headroom applies.
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { z } from "zod";
import { callOpenAiJson } from "@/lib/openai/client";
import { withSchemaValidation } from "@/lib/gemini/withSchemaValidation";
import {
  HANDWRITING_TRANSCRIPTION_INSTRUCTIONS,
  buildHandwritingTranscriptionUserPrompt,
} from "@/lib/openai/prompts/handwritingTranscription";
import { CrossCheckRequestSchema, GptTranscriptionArraySchema } from "@/lib/schemas/handwritingCrossCheck";
import { transcriptionsAgree } from "@/lib/mapping/handwritingSimilarity";
import { normalizeError, pipelineErrorToResponseBody } from "@/lib/errors";

const responseJsonSchema = z.toJSONSchema(GptTranscriptionArraySchema);

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "api-error" }, { status: 400 });
  }

  const parsedRequest = CrossCheckRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: `Invalid request body: ${parsedRequest.error.issues.map((i) => i.message).join("; ")}`, code: "api-error" },
      { status: 400 },
    );
  }
  const { crops } = parsedRequest.data;

  try {
    const attempt = async (correctionNote?: string) =>
      callOpenAiJson({
        instructions: HANDWRITING_TRANSCRIPTION_INSTRUCTIONS,
        userText:
          buildHandwritingTranscriptionUserPrompt(crops.length) +
          (correctionNote ? `\n\n${correctionNote}` : ""),
        images: crops.map((c) => c.dataUrl),
        responseJsonSchema,
        responseSchemaName: "handwriting_transcriptions",
      });

    const result = await withSchemaValidation(GptTranscriptionArraySchema, attempt);
    if (!result.ok) {
      return NextResponse.json(pipelineErrorToResponseBody(result.error), { status: 502 });
    }

    const results = result.data.transcriptions
      .filter((t) => t.index >= 0 && t.index < crops.length)
      .map((t) => {
        const crop = crops[t.index];
        return {
          regionId: crop.regionId,
          gptTranscription: t.transcription,
          agrees: transcriptionsAgree(crop.geminiTranscription, t.transcription),
        };
      });

    return NextResponse.json({ results });
  } catch (error) {
    const pipelineError = normalizeError(error, "api-error");
    return NextResponse.json(pipelineErrorToResponseBody(pipelineError), { status: 500 });
  }
}
