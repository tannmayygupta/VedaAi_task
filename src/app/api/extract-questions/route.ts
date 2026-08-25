export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { fetchBlobFile } from "@/lib/gemini/fetchBlobFile";
import { QuestionArraySchema, type Question } from "@/lib/schemas/question";
import { normalizeError, pipelineErrorToResponseBody } from "@/lib/errors";

type RequestBody = { blobUrl: string };

// TODO(Phase 3): replace this stub with a real Gemini call (see docs/PRD.md §6 and
// docs/RESEARCH.md §8 for the drafted prompt/schema) that actually extracts questions
// from the fetched file's bytes/mimeType. This stub exists only to prove the route's
// request/response plumbing works end-to-end before real extraction logic lands.
async function extractQuestionsStub(_file: { bytes: ArrayBuffer; mimeType: string }): Promise<Question[]> {
  return [
    {
      id: "q1",
      number: "1",
      subpart: null,
      displayLabel: "1",
      text: "Placeholder question — real extraction lands in Phase 3.",
      marksTotal: null,
      pageIndex: 0,
      order: 0,
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
    return NextResponse.json({ error: "Missing required field: blobUrl", code: "api-error" }, { status: 400 });
  }

  try {
    const file = await fetchBlobFile(body.blobUrl);
    const questions = await extractQuestionsStub(file);
    const validated = QuestionArraySchema.safeParse(questions);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Extraction produced an invalid result", code: "malformed-response" },
        { status: 502 },
      );
    }
    return NextResponse.json({ questions: validated.data });
  } catch (error) {
    const pipelineError = normalizeError(error, "unreadable-file");
    return NextResponse.json(pipelineErrorToResponseBody(pipelineError), { status: 500 });
  }
}
