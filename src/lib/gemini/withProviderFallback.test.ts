import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { withProviderFallback } from "./withProviderFallback";

const schema = z.object({ value: z.string() });

describe("withProviderFallback", () => {
  it("returns Gemini's result and tags provider 'gemini' when Gemini succeeds", async () => {
    const geminiAttempt = vi.fn().mockResolvedValue({ value: "from-gemini" });
    const openAiAttempt = vi.fn();

    const result = await withProviderFallback(schema, geminiAttempt, openAiAttempt);

    expect(result).toEqual({ ok: true, data: { value: "from-gemini" }, provider: "gemini" });
    expect(openAiAttempt).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI and tags provider 'openai' when Gemini fails entirely", async () => {
    const geminiAttempt = vi.fn().mockRejectedValue(new Error("quota exceeded"));
    const openAiAttempt = vi.fn().mockResolvedValue({ value: "from-openai" });

    const result = await withProviderFallback(schema, geminiAttempt, openAiAttempt);

    expect(result).toEqual({ ok: true, data: { value: "from-openai" }, provider: "openai" });
  });

  it("falls back to OpenAI when Gemini's response is malformed even after its own retry", async () => {
    const geminiAttempt = vi.fn().mockResolvedValue({ wrong: "shape" });
    const openAiAttempt = vi.fn().mockResolvedValue({ value: "from-openai" });

    const result = await withProviderFallback(schema, geminiAttempt, openAiAttempt);

    expect(geminiAttempt).toHaveBeenCalledTimes(2); // withSchemaValidation's own 1 retry
    expect(result).toEqual({ ok: true, data: { value: "from-openai" }, provider: "openai" });
  });

  it("returns a failure when both providers fail", async () => {
    const geminiAttempt = vi.fn().mockRejectedValue(new Error("gemini down"));
    const openAiAttempt = vi.fn().mockRejectedValue(new Error("openai down"));

    const result = await withProviderFallback(schema, geminiAttempt, openAiAttempt);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/openai down/);
    }
  });
});
