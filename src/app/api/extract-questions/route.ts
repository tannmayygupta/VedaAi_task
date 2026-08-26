export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchBlobFile } from "@/lib/gemini/fetchBlobFile";
import { callGeminiJson } from "@/lib/gemini/client";
import { withSchemaValidation } from "@/lib/gemini/withSchemaValidation";
import { textPart, fileBytesToPart } from "@/lib/gemini/part";
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

  try {
    const file = await fetchBlobFile(body.blobUrl);

    const attempt = async (correctionNote?: string) =>
      callGeminiJson({
        parts: [
          textPart(QUESTION_EXTRACTION_SYSTEM_PROMPT),
          textPart(buildQuestionExtractionUserPrompt()),
          fileBytesToPart(file.bytes, file.mimeType),
          ...(correctionNote ? [textPart(correctionNote)] : []),
        ],
        responseJsonSchema,
      });

    const result = await withSchemaValidation(ResponseSchema, attempt);
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

    return NextResponse.json({ questions });
  } catch (error) {
    const pipelineError = normalizeError(error, "unreadable-file");
    return NextResponse.json(pipelineErrorToResponseBody(pipelineError), { status: 500 });
  }
}
