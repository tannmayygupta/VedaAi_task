export const runtime = "nodejs";

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 10 * 1024 * 1024,
        // Vercel Blob defaults to neither randomizing the pathname nor allowing
        // overwrite — two uploads with the same filename (e.g. every merged
        // multi-image answer sheet is always named "merged-answer-sheet.pdf",
        // per mergeFilesToPdf.ts) would otherwise collide and fail outright.
        // There's no auth/per-user namespacing in this app, so this is a real,
        // easily-reachable case, not a hypothetical one.
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // No server-side bookkeeping needed yet — files are processed by a later route
        // once both slots finish uploading (see PRD §4/§13). Intentionally a no-op for now.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown upload error" },
      { status: 400 },
    );
  }
}
