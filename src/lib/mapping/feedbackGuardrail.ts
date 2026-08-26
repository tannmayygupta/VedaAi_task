export const MIN_REASONABLE_FEEDBACK_LENGTH = 10; // characters — shorter can't be a real sentence
export const MAX_REASONABLE_FEEDBACK_LENGTH = 2000; // characters — longer suggests a runaway/repetition failure

/**
 * Returns true if feedback text passes basic sanity checks: non-empty after
 * trimming whitespace, and within a reasonable length range. This is NOT a
 * quality or tone judge — it only catches pathological failures (empty
 * output, truncation artifacts, runaway repetition), not "is this good
 * feedback," which isn't something a pure function can assess.
 */
export function isFeedbackReasonable(feedback: string): boolean {
  const trimmed = feedback.trim();
  return (
    trimmed.length >= MIN_REASONABLE_FEEDBACK_LENGTH &&
    trimmed.length <= MAX_REASONABLE_FEEDBACK_LENGTH
  );
}

/**
 * A safe fallback string to show instead of pathological feedback, so the UI
 * never shows genuinely broken text (blank space, or a wall of repeated
 * garbage) to a teacher.
 */
export const FALLBACK_FEEDBACK_TEXT = "No detailed feedback is available for this answer.";

/**
 * Returns the given feedback if it passes isFeedbackReasonable, otherwise
 * the fallback text.
 */
export function sanitizeFeedback(feedback: string): string {
  return isFeedbackReasonable(feedback) ? feedback : FALLBACK_FEEDBACK_TEXT;
}
