import type { ZodType } from "zod";
import type { PipelineError } from "../errors";
import { withSchemaValidation } from "./withSchemaValidation";

export type ProviderFallbackResult<T> =
  | { ok: true; data: T; provider: "gemini" | "openai" }
  | { ok: false; error: PipelineError };

/**
 * Tries Gemini first (with its own built-in one-retry-on-malformed-response
 * behavior, see withSchemaValidation). If Gemini fails entirely — a hard
 * error (network, quota-exceeded) or a malformed response even after its own
 * retry — falls back to OpenAI as a second, independent attempt at the SAME
 * job, not just a cross-check, before giving up. OpenAI gets its own
 * one-retry-on-malformed-response too, via the same withSchemaValidation.
 *
 * Only ever called for the two primary extraction routes (questions,
 * answer-mapping) — the handwriting cross-check stays Gemini-output-only
 * verification, unrelated to this failover.
 */
export async function withProviderFallback<T>(
  schema: ZodType<T>,
  geminiAttempt: (correctionNote?: string) => Promise<unknown>,
  openAiAttempt: (correctionNote?: string) => Promise<unknown>,
): Promise<ProviderFallbackResult<T>> {
  const geminiResult = await withSchemaValidation(schema, geminiAttempt);
  if (geminiResult.ok) {
    return { ok: true, data: geminiResult.data, provider: "gemini" };
  }

  const openAiResult = await withSchemaValidation(schema, openAiAttempt);
  if (openAiResult.ok) {
    return { ok: true, data: openAiResult.data, provider: "openai" };
  }

  return { ok: false, error: openAiResult.error };
}
