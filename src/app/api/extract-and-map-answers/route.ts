export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchBlobFile } from "@/lib/gemini/fetchBlobFile";
import { callGeminiJson } from "@/lib/gemini/client";
import { withSchemaValidation } from "@/lib/gemini/withSchemaValidation";
import { textPart, fileBytesToPart } from "@/lib/gemini/part";
import {
  ANSWER_MAPPING_SYSTEM_PROMPT,
  buildAnswerMappingUserPrompt,
} from "@/lib/gemini/prompts/answerMapping";
import { AnswerRegionArraySchema } from "@/lib/schemas/answerRegion";
import { QuestionArraySchema, type Question } from "@/lib/schemas/question";
import { normalizeError, pipelineErrorToResponseBody } from "@/lib/errors";

type RequestBody = { blobUrl: string; questions: Question[] };

const ResponseSchema = z.object({ regions: AnswerRegionArraySchema });
const responseJsonSchema = z.toJSONSchema(ResponseSchema);

export async function POST(request: Request): Promise<NextResponse> {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "api-error" }, { status: 400 });
  }

  if (!body.blobUrl || typeof body.blobUrl !== "string") {
    return NextResponse.json(
      { error: "Missing required field: blobUrl", code: "api-error" },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.questions)) {
    return NextResponse.json(
      { error: "Missing required field: questions", code: "api-error" },
      { status: 400 },
    );
  }

  const questionsCheck = QuestionArraySchema.safeParse(body.questions);
  if (!questionsCheck.success) {
    return NextResponse.json(
      { error: "questions did not match the expected shape", code: "api-error" },
      { status: 400 },
    );
  }
  const questions = questionsCheck.data;

  try {
    const file = await fetchBlobFile(body.blobUrl);

    const attempt = async (correctionNote?: string) =>
      callGeminiJson({
        parts: [
          textPart(ANSWER_MAPPING_SYSTEM_PROMPT),
          textPart(buildAnswerMappingUserPrompt(questions)),
          fileBytesToPart(file.bytes, file.mimeType),
          ...(correctionNote ? [textPart(correctionNote)] : []),
        ],
        responseJsonSchema,
      });

    const result = await withSchemaValidation(ResponseSchema, attempt);
    if (!result.ok) {
      return NextResponse.json(pipelineErrorToResponseBody(result.error), { status: 502 });
    }

    // Cross-check matchedQuestionId against the real injected question ids — the
    // AnswerRegion schema alone can't validate this since it has no visibility into
    // the question list at parse time (see docs/RESEARCH.md §9 note on this).
    const validQuestionIds = new Set(questions.map((q) => q.id));
    const regions = result.data.regions.map((region) =>
      region.matchedQuestionId && !validQuestionIds.has(region.matchedQuestionId)
        ? { ...region, matchedQuestionId: null, matchConfidence: 0 }
        : region,
    );

    return NextResponse.json({ regions });
  } catch (error) {
    const pipelineError = normalizeError(error, "unreadable-file");
    return NextResponse.json(pipelineErrorToResponseBody(pipelineError), { status: 500 });
  }
}
