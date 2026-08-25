import { describe, expect, it } from "vitest";
import { PipelineError, normalizeError, pipelineErrorToResponseBody } from "./errors";

describe("normalizeError", () => {
  it("returns an existing PipelineError unchanged", () => {
    const original = new PipelineError("unreadable-file", "cannot read file");
    const result = normalizeError(original);
    expect(result).toBe(original);
    expect(result.code).toBe("unreadable-file");
    expect(result.message).toBe("cannot read file");
  });

  it("classifies a quota-related message as quota-exceeded", () => {
    const result = normalizeError(new Error("quota exceeded for today"));
    expect(result).toBeInstanceOf(PipelineError);
    expect(result.code).toBe("quota-exceeded");
    expect(result.message).toBe("quota exceeded for today");
  });

  it("classifies a fetch-related message as network-error", () => {
    const result = normalizeError(new Error("failed to fetch"));
    expect(result.code).toBe("network-error");
  });

  it("falls back to 'unknown' by default for an unclassifiable error", () => {
    const result = normalizeError(new Error("something else broke"));
    expect(result.code).toBe("unknown");
  });

  it("uses an explicit fallbackCode for an unclassifiable error", () => {
    const result = normalizeError(new Error("something else broke"), "malformed-response");
    expect(result.code).toBe("malformed-response");
  });

  it("never throws for a non-Error thrown value (string)", () => {
    const result = normalizeError("just a string");
    expect(result).toBeInstanceOf(PipelineError);
    expect(result.code).toBe("unknown");
    expect(result.cause).toBe("just a string");
  });

  it("never throws for a non-Error thrown value (plain object)", () => {
    const weird = { oops: true };
    const result = normalizeError(weird, "api-error");
    expect(result).toBeInstanceOf(PipelineError);
    expect(result.code).toBe("api-error");
    expect(result.cause).toBe(weird);
  });
});

describe("pipelineErrorToResponseBody", () => {
  it("returns the expected shape", () => {
    const error = new PipelineError("quota-exceeded", "too many requests");
    expect(pipelineErrorToResponseBody(error)).toEqual({
      error: "too many requests",
      code: "quota-exceeded",
    });
  });
});
