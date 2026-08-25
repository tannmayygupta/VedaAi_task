export type PipelineErrorCode =
  | "api-error"
  | "quota-exceeded"
  | "malformed-response"
  | "unreadable-file"
  | "network-error"
  | "unknown";

export class PipelineError extends Error {
  readonly code: PipelineErrorCode;
  readonly cause?: unknown;

  constructor(code: PipelineErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
    this.cause = cause;
  }
}

export function normalizeError(
  error: unknown,
  fallbackCode: PipelineErrorCode = "unknown",
): PipelineError {
  if (error instanceof PipelineError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    let code: PipelineErrorCode = fallbackCode;

    if (message.includes("quota") || message.includes("rate limit")) {
      code = "quota-exceeded";
    } else if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("econnrefused")
    ) {
      code = "network-error";
    }

    return new PipelineError(code, error.message, error);
  }

  return new PipelineError(fallbackCode, "An unexpected error occurred", error);
}

export function pipelineErrorToResponseBody(
  error: PipelineError,
): { error: string; code: PipelineErrorCode } {
  return { error: error.message, code: error.code };
}
