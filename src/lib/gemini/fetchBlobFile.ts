export type FetchedFile = {
  bytes: ArrayBuffer;
  mimeType: string;
  sizeBytes: number;
};

/**
 * Fetches a file previously uploaded to Vercel Blob, server-side, by its
 * public URL. Throws a plain Error (callers normalize via `normalizeError`
 * from a sibling `@/lib/errors` module) if the fetch fails or returns a
 * non-OK status.
 */
export async function fetchBlobFile(url: string): Promise<FetchedFile> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from Blob storage: ${response.status} ${response.statusText}`);
  }
  const bytes = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") ?? "application/octet-stream";
  return { bytes, mimeType, sizeBytes: bytes.byteLength };
}
