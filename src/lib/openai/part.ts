/**
 * Converts raw file bytes into the base64 data URI OpenAI's Responses API
 * `input_file` content type expects (`data:<mimeType>;base64,<data>`) —
 * mirrors @/lib/gemini/part.ts's fileBytesToPart, one per provider's own
 * expected shape (Gemini wants raw base64, OpenAI wants a full data URI).
 */
export function fileBytesToDataUri(bytes: ArrayBuffer, mimeType: string): string {
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Routes a fetched file to the OpenAI content type it actually belongs
 * under: images via `input_image` (the pre-existing, cross-check-proven
 * path), everything else (PDFs) via `input_file` — OpenAI's own docs only
 * cover `input_file` for documents, not images, so this doesn't assume it
 * works for both.
 */
export function buildOpenAiFileInput(
  bytes: ArrayBuffer,
  mimeType: string,
  filename: string,
): { images?: string[]; files?: { dataUri: string; filename: string }[] } {
  const dataUri = fileBytesToDataUri(bytes, mimeType);
  return mimeType.startsWith("image/") ? { images: [dataUri] } : { files: [{ dataUri, filename }] };
}
