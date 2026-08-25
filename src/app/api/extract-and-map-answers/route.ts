export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { fetchBlobFile } from "@/lib/gemini/fetchBlobFile";
import { AnswerRegionArraySchema, type AnswerRegion } from "@/lib/schemas/answerRegion";
import type { Question } from "@/lib/schemas/question";
import { normalizeError, pipelineErrorToResponseBody } from "@/lib/errors";

type RequestBody = { blobUrl: string; questions: Question[] };

// TODO(Phase 4): replace this stub with the real combined extract+map Gemini call (see
// docs/PRD.md §7 and docs/RESEARCH.md §9 for the drafted prompt/schema and matching
// priority order: label > sequential > semantic > unmatched). This stub exists only to
// prove the route's request/response plumbing works end-to-end before real logic lands.
async function extractAndMapAnswersStub(
  _file: { bytes: ArrayBuffer; mimeType: string },
  questions: Question[],
): Promise<AnswerRegion[]> {
  if (questions.length === 0) {
    return [];
  }
  return [
    {
      id: "r1",
      pageIndex: 0,
      boundingBox: { yMin: 100, xMin: 100, yMax: 300, xMax: 800 },
      transcribedText: "Placeholder answer — real extraction+mapping lands in Phase 4.",
      detectedLabel: null,
      matchedQuestionId: questions[0].id,
      matchConfidence: 0.5,
      continuesFromRegionId: null,
    },
  ];
}

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

  try {
    const file = await fetchBlobFile(body.blobUrl);
    const regions = await extractAndMapAnswersStub(file, body.questions);
    const validated = AnswerRegionArraySchema.safeParse(regions);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Extraction produced an invalid result", code: "malformed-response" },
        { status: 502 },
      );
    }
    return NextResponse.json({ regions: validated.data });
  } catch (error) {
    const pipelineError = normalizeError(error, "unreadable-file");
    return NextResponse.json(pipelineErrorToResponseBody(pipelineError), { status: 500 });
  }
}
