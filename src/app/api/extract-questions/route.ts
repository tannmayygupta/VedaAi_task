export const runtime = "nodejs";
// See extract-and-map-answers/route.ts for why this isn't 60 anymore — a
// dense multi-page question paper could plausibly take proportionally
// longer than the ~28s measured for a single dense page.
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchBlobFile, isAllowedBlobUrl } from "@/lib/gemini/fetchBlobFile";
import { callGeminiJson } from "@/lib/gemini/client";
import { withProviderFallback } from "@/lib/gemini/withProviderFallback";
import { textPart, fileBytesToPart } from "@/lib/gemini/part";
import { callOpenAiJson } from "@/lib/openai/client";
import { buildOpenAiFileInput } from "@/lib/openai/part";
import { filenameForMimeType } from "@/lib/mimeFilename";
import {
  QUESTION_EXTRACTION_SYSTEM_PROMPT,
  buildQuestionExtractionUserPrompt,
} from "@/lib/gemini/prompts/questionExtraction";
import { QuestionArraySchema } from "@/lib/schemas/question";
import {
  assertPrintedOrder,
  formatDisplayLabel,
  generateQuestionId,
} from "@/lib/schemas/questionNumbering";
import { normalizeError, pipelineErrorToResponseBody, PipelineError } from "@/lib/errors";

type RequestBody = { blobUrl: string };

const ResponseSchema = z.object({ questions: QuestionArraySchema });
const responseJsonSchema = z.toJSONSchema(ResponseSchema);

export async function POST(request: Request): Promise<NextResponse> {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "api-error" }, { status: 400 });
  }

  if (!body.blobUrl || typeof body.blobUrl !== "string") {
    return NextResponse.json({ error: "Missing required field: blobUrl", code: "api-error" }, { status: 400 });
  }
  if (!isAllowedBlobUrl(body.blobUrl)) {
    return NextResponse.json({ error: "blobUrl is not a valid Blob storage URL", code: "api-error" }, { status: 400 });
  }

  try {
    const file = await fetchBlobFile(body.blobUrl);

    const geminiAttempt = async (correctionNote?: string) =>
      callGeminiJson({
        parts: [
          textPart(QUESTION_EXTRACTION_SYSTEM_PROMPT),
          textPart(buildQuestionExtractionUserPrompt()),
          fileBytesToPart(file.bytes, file.mimeType),
          ...(correctionNote ? [textPart(correctionNote)] : []),
        ],
        responseJsonSchema,
      });

    // Failover, not just a cross-check: if Gemini is down or exhausted,
    // OpenAI independently redoes the same extraction from the same file,
    // using the same (provider-agnostic) prompt text — see docs/DECISIONS.md.
    const openAiAttempt = async (correctionNote?: string) =>
      callOpenAiJson({
        instructions: QUESTION_EXTRACTION_SYSTEM_PROMPT,
        userText:
          buildQuestionExtractionUserPrompt() + (correctionNote ? `\n\n${correctionNote}` : ""),
        ...buildOpenAiFileInput(
          file.bytes,
          file.mimeType,
          filenameForMimeType(file.mimeType, "question-paper"),
        ),
        responseJsonSchema,
        responseSchemaName: "question_extraction",
      });

    const result = await withProviderFallback(ResponseSchema, geminiAttempt, openAiAttempt);
    if (!result.ok) {
      return NextResponse.json(pipelineErrorToResponseBody(result.error), { status: 502 });
    }

    // displayLabel and id are fully derivable from number+subpart — recompute them
    // deterministically rather than trust the model's own formatting (observed
    // inconsistency during Phase 3 verification: "5(a)" vs the intended "5 (a)").
    const questions = result.data.questions.map((question) => ({
      ...question,
      id: generateQuestionId(question.number, question.subpart),
      displayLabel: formatDisplayLabel(question.number, question.subpart),
    }));

    // The model is instructed to return questions in printed order; assert that
    // invariant rather than silently trusting it, since the UI (and the
    // extraction-order requirement) depends on it.
    try {
      assertPrintedOrder(questions);
    } catch (orderError) {
      throw new PipelineError(
        "malformed-response",
        (orderError as Error).message,
        orderError,
      );
    }

    return NextResponse.json({ questions, provider: result.provider });
  } catch (error) {
    const pipelineError = normalizeError(error, "unreadable-file");
    return NextResponse.json(pipelineErrorToResponseBody(pipelineError), { status: 500 });
  }
}
