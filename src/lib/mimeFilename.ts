const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * A filename hint for OpenAI's `input_file` content type, which requires one
 * but doesn't care what it is beyond the extension matching the actual bytes
 * — we never learn the teacher's original filename this far into the
 * pipeline (only the Blob URL + fetched bytes), so this is synthesized.
 */
export function filenameForMimeType(mimeType: string, baseName: string): string {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType] ?? "bin";
  return `${baseName}.${extension}`;
}
