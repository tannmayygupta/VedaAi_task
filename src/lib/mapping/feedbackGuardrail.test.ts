import { describe, expect, it } from "vitest";
import {
  isFeedbackReasonable,
  sanitizeFeedback,
  FALLBACK_FEEDBACK_TEXT,
  MIN_REASONABLE_FEEDBACK_LENGTH,
  MAX_REASONABLE_FEEDBACK_LENGTH,
} from "./feedbackGuardrail";

describe("isFeedbackReasonable", () => {
  it("returns true for a normal sentence", () => {
    expect(isFeedbackReasonable("Great job identifying the correct answer!")).toBe(true);
  });

  it("returns false for an empty string", () => {
    expect(isFeedbackReasonable("")).toBe(false);
  });

  it("returns false for a whitespace-only string", () => {
    expect(isFeedbackReasonable("   ")).toBe(false);
  });

  it("returns false for a too-short string", () => {
    expect(isFeedbackReasonable("ok")).toBe(false);
  });

  it("returns true for a string exactly at the minimum length (inclusive boundary)", () => {
    const text = "a".repeat(MIN_REASONABLE_FEEDBACK_LENGTH);
    expect(isFeedbackReasonable(text)).toBe(true);
  });

  it("returns false for a string exceeding the maximum length", () => {
    const text = "a".repeat(MAX_REASONABLE_FEEDBACK_LENGTH + 1);
    expect(isFeedbackReasonable(text)).toBe(false);
  });
});

describe("sanitizeFeedback", () => {
  it("passes a reasonable string through unchanged", () => {
    const text = "This is a solid, reasonable piece of feedback.";
    expect(sanitizeFeedback(text)).toBe(text);
  });

  it("returns the fallback for an empty string", () => {
    expect(sanitizeFeedback("")).toBe(FALLBACK_FEEDBACK_TEXT);
  });

  it("returns the fallback for a too-long string", () => {
    const text = "a".repeat(MAX_REASONABLE_FEEDBACK_LENGTH + 1);
    expect(sanitizeFeedback(text)).toBe(FALLBACK_FEEDBACK_TEXT);
  });
});
