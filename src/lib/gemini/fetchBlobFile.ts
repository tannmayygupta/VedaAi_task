export type FetchedFile = {
  bytes: ArrayBuffer;
  mimeType: string;
  sizeBytes: number;
};

const ALLOWED_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * True only for an https URL on our Vercel Blob store's public read domain.
 * Without this check, `fetchBlobFile` would fetch (and hand to Gemini) any
 * URL a client sends — an SSRF hole, since these routes take `blobUrl`
 * straight from the request body with no other validation.
 */
export function isAllowedBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(ALLOWED_BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Fetches a file previously uploaded to Vercel Blob, server-side, by its
 * public URL. Throws a plain Error (callers normalize via `normalizeError`
 * from a sibling `@/lib/errors` module) if the fetch fails or returns a
 * non-OK status.
 */
export async function fetchBlobFile(url: string): Promise<FetchedFile> {
  if (!isAllowedBlobUrl(url)) {
    throw new Error("Refusing to fetch a URL outside the configured Vercel Blob store");
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from Blob storage: ${response.status} ${response.statusText}`);
  }
  const bytes = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") ?? "application/octet-stream";
  return { bytes, mimeType, sizeBytes: bytes.byteLength };
}
