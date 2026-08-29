export const runtime = "nodejs";
// A real 15-page handwritten answer sheet with dense math content measured at
// ~108s for this route's single combined Gemini call (transcribe + match +
// grade) — well past the old 60s cap, which would have killed the function
// mid-request on Vercel. 300s matches Vercel's Fluid Compute ceiling on the
// Hobby plan (see docs/DECISIONS.md), giving real headroom for larger/denser
// documents than this test case.
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
  ANSWER_MAPPING_SYSTEM_PROMPT,
  buildAnswerMappingUserPrompt,
} from "@/lib/gemini/prompts/answerMapping";
import { buildMappingResponseSchema } from "@/lib/schemas/mappingResponse";
import { buildMappingSummary } from "@/lib/mapping/mappingSummary";
import { normalizeMarksAwarded } from "@/lib/mapping/defaultMarks";
import { countPdfPages } from "@/lib/mapping/countPdfPages";
import { hasFullPageCoverage, maxValidPageCovered } from "@/lib/mapping/pageCoverage";
import { QuestionArraySchema, type Question } from "@/lib/schemas/question";
import { normalizeError, pipelineErrorToResponseBody } from "@/lib/errors";

type RequestBody = { blobUrl: string; questions: Question[] };

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
  if (!isAllowedBlobUrl(body.blobUrl)) {
    return NextResponse.json(
      { error: "blobUrl is not a valid Blob storage URL", code: "api-error" },
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
  const ResponseSchema = buildMappingResponseSchema(questions.map((q) => q.id));
  const responseJsonSchema = z.toJSONSchema(ResponseSchema);

  try {
    const file = await fetchBlobFile(body.blobUrl);

    const geminiAttempt = async (correctionNote?: string) =>
      callGeminiJson({
        parts: [
          textPart(ANSWER_MAPPING_SYSTEM_PROMPT),
          textPart(buildAnswerMappingUserPrompt(questions)),
          fileBytesToPart(file.bytes, file.mimeType),
          ...(correctionNote ? [textPart(correctionNote)] : []),
        ],
        responseJsonSchema,
      });

    // Failover, not just a cross-check: if Gemini is down or exhausted,
    // OpenAI independently redoes the same transcribe+match+grade job from
    // the same file, using the same prompt text — see docs/DECISIONS.md.
    const openAiAttempt = async (correctionNote?: string) =>
      callOpenAiJson({
        instructions: ANSWER_MAPPING_SYSTEM_PROMPT,
        userText:
          buildAnswerMappingUserPrompt(questions) + (correctionNote ? `\n\n${correctionNote}` : ""),
        ...buildOpenAiFileInput(
          file.bytes,
          file.mimeType,
          filenameForMimeType(file.mimeType, "answer-sheet"),
        ),
        responseJsonSchema,
        responseSchemaName: "answer_mapping",
      });

    const result = await withProviderFallback(ResponseSchema, geminiAttempt, openAiAttempt);
    if (!result.ok) {
      return NextResponse.json(pipelineErrorToResponseBody(result.error), { status: 502 });
    }

    // Guardrail against real observed run-to-run variance (see docs/DECISIONS.md
    // "Post-mitigation re-audit of the OpenAI failover"): either provider can stop
    // segmenting partway through a dense multi-page sheet and still confidently
    // grade the un-reviewed later questions. If the winning provider's response
    // doesn't reach near the sheet's real last page, give that SAME provider one
    // more attempt with an explicit note before accepting the result as-is.
    const totalPages = await countPdfPages(file.bytes, file.mimeType);
    let mappingData = result.data;
    let incompleteCoverage = !hasFullPageCoverage(mappingData.regions, totalPages);
    if (incompleteCoverage && totalPages !== null) {
      const retryAttempt = result.provider === "gemini" ? geminiAttempt : openAiAttempt;
      const coverageNote =
        `Your previous response only found content through page ${maxValidPageCovered(mappingData.regions, totalPages) + 1} ` +
        `of this ${totalPages}-page answer sheet. Review the remaining pages (through page ${totalPages}) as ` +
        `well and include any answers found there — do not stop early.`;
      try {
        const retryParsed = ResponseSchema.safeParse(await retryAttempt(coverageNote));
        if (
          retryParsed.success &&
          maxValidPageCovered(retryParsed.data.regions, totalPages) >
            maxValidPageCovered(mappingData.regions, totalPages)
        ) {
          mappingData = retryParsed.data;
        }
      } catch {
        // A failed retry shouldn't turn an already-successful result into an error —
        // fall through and report on the original result's coverage instead.
      }
      incompleteCoverage = !hasFullPageCoverage(mappingData.regions, totalPages);
    }

    // Cross-check matchedQuestionId against the real injected question ids — the
    // AnswerRegion schema alone can't validate this since it has no visibility into
    // the question list at parse time (see docs/RESEARCH.md §9 note on this).
    const validQuestionIds = new Set(questions.map((q) => q.id));
    const regions = mappingData.regions.map((region) =>
      region.matchedQuestionId && !validQuestionIds.has(region.matchedQuestionId)
        ? { ...region, matchedQuestionId: null, matchConfidence: 0 }
        : region,
    );
    // The prompt asks the model to round to a whole or half mark, but nothing
    // in GradingSchema enforced that — normalize here rather than trust it.
    const gradings = mappingData.gradings.map((g) => ({
      ...g,
      marksAwarded: normalizeMarksAwarded(g.marksAwarded, g.marksTotal),
    }));
    const summary = buildMappingSummary(gradings, regions);

    return NextResponse.json({
      regions,
      gradings,
      summary,
      provider: result.provider,
      incompleteCoverage,
    });
  } catch (error) {
    const pipelineError = normalizeError(error, "unreadable-file");
    return NextResponse.json(pipelineErrorToResponseBody(pipelineError), { status: 500 });
  }
}
