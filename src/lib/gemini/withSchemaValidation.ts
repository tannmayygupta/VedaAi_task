import type { ZodType } from "zod";
import { normalizeError, PipelineError } from "../errors";

export type SchemaValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PipelineError };

/**
 * Calls `attempt()` to get raw JSON, validates it against `schema`. If
 * validation fails, calls `attempt()` again ONCE, passing a correction note
 * describing what was wrong, before giving up with a "malformed-response"
 * error. If `attempt()` itself throws (at either try), that's normalized and
 * returned immediately without a second retry (a thrown error means the
 * underlying call itself failed, not that its output was malformed — retrying
 * a validation failure is the only case this function retries).
 */
export async function withSchemaValidation<T>(
  schema: ZodType<T>,
  attempt: (correctionNote?: string) => Promise<unknown>,
): Promise<SchemaValidationResult<T>> {
  try {
    const first = await attempt();
    const firstResult = schema.safeParse(first);
    if (firstResult.success) {
      return { ok: true, data: firstResult.data };
    }

    const correctionNote =
      `Your previous response did not match the required schema. Validation errors: ` +
      `${firstResult.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}. ` +
      `Please respond again with corrected JSON that matches the schema exactly.`;

    const second = await attempt(correctionNote);
    const secondResult = schema.safeParse(second);
    if (secondResult.success) {
      return { ok: true, data: secondResult.data };
    }

    return {
      ok: false,
      error: new PipelineError(
        "malformed-response",
        `Model response did not match the required schema after one retry: ${secondResult.error.issues.map((i) => i.message).join("; ")}`,
      ),
    };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
}
