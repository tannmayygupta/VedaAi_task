import { upload } from "@vercel/blob/client";

export const BLOB_UPLOAD_TOKEN_ROUTE = "/api/blob-upload-token";

export type BlobUploadResult = { url: string; pathname: string };

/**
 * Uploads a file directly to Vercel Blob from the browser, bypassing our own
 * Function's request-body size limit. Errors from the underlying `upload()`
 * call are not caught here — they propagate to the caller, which owns error
 * display/handling.
 */
export async function uploadFileToBlob(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<BlobUploadResult> {
  const result = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: BLOB_UPLOAD_TOKEN_ROUTE,
    onUploadProgress: onProgress
      ? (event) => onProgress(event.percentage)
      : undefined,
  });

  return { url: result.url, pathname: result.pathname };
}
