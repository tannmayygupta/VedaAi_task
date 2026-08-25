export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type FileValidationResult =
  | { valid: true }
  | { valid: false; reason: "invalid-type" | "too-large" };

export function validateFile(file: File): FileValidationResult {
  if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
    return { valid: false, reason: "invalid-type" };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: "too-large" };
  }
  return { valid: true };
}

export function validateFiles(files: File[]): FileValidationResult {
  for (const file of files) {
    const result = validateFile(file);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}
