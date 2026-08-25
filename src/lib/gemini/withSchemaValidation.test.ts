import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { withSchemaValidation } from "./withSchemaValidation";

vi.mock("../errors", () => {
  class PipelineError extends Error {
    code: string;
    cause?: unknown;
    constructor(code: string, message: string, cause?: unknown) {
      super(message);
      this.code = code;
      this.cause = cause;
    }
  }
  function normalizeError(error: unknown, fallbackCode = "unknown") {
    if (error instanceof PipelineError) return error;
    return new PipelineError(
      fallbackCode,
      error instanceof Error ? error.message : String(error),
      error,
    );
  }
  return { PipelineError, normalizeError };
});

const schema = z.object({ foo: z.string() });

describe("withSchemaValidation", () => {
  it("returns ok on the first valid attempt and calls attempt once", async () => {
    const attempt = vi.fn().mockResolvedValue({ foo: "bar" });
    const result = await withSchemaValidation(schema, attempt);
    expect(result).toEqual({ ok: true, data: { foo: "bar" } });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("retries once with a correction note when the first attempt is invalid, then succeeds", async () => {
    const attempt = vi
      .fn()
      .mockResolvedValueOnce({ foo: 123 })
      .mockResolvedValueOnce({ foo: "bar" });
    const result = await withSchemaValidation(schema, attempt);
    expect(result).toEqual({ ok: true, data: { foo: "bar" } });
    expect(attempt).toHaveBeenCalledTimes(2);
    const secondCallArg = attempt.mock.calls[1][0];
    expect(typeof secondCallArg).toBe("string");
    expect(secondCallArg.length).toBeGreaterThan(0);
  });

  it("gives up with a malformed-response error after both attempts are invalid", async () => {
    const attempt = vi.fn().mockResolvedValue({ foo: 123 });
    const result = await withSchemaValidation(schema, attempt);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("malformed-response");
    }
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it("returns immediately without retrying when attempt throws", async () => {
    const attempt = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await withSchemaValidation(schema, attempt);
    expect(result.ok).toBe(false);
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});
