import { describe, expect, it } from "vitest";
import {
  similarityRatio,
  transcriptionsAgree,
  expectedVisibleText,
  HANDWRITING_AGREEMENT_THRESHOLD,
} from "./handwritingSimilarity";

describe("similarityRatio", () => {
  it("returns 1 for identical strings", () => {
    expect(similarityRatio("The mitochondria", "The mitochondria")).toBe(1);
  });

  it("returns 1 for two empty strings", () => {
    expect(similarityRatio("", "")).toBe(1);
  });

  it("is case-insensitive and whitespace-insensitive", () => {
    expect(similarityRatio("The Mitochondria", "  the   mitochondria  ")).toBe(1);
  });

  it("returns a lower ratio for genuinely different text", () => {
    const ratio = similarityRatio("The mitochondria is the powerhouse of the cell", "Paris is the capital of France");
    expect(ratio).toBeLessThan(HANDWRITING_AGREEMENT_THRESHOLD);
  });

  it("tolerates a single small difference in a longer string", () => {
    const ratio = similarityRatio(
      "The powerhouse of the cell is the mitochondria",
      "The powerhouse of the cell is the mitochondria.",
    );
    expect(ratio).toBeGreaterThanOrEqual(HANDWRITING_AGREEMENT_THRESHOLD);
  });
});

describe("transcriptionsAgree", () => {
  it("agrees on identical transcriptions", () => {
    expect(transcriptionsAgree("Delhi", "Delhi")).toBe(true);
  });

  it("disagrees on completely different transcriptions", () => {
    expect(transcriptionsAgree("Delhi", "Mumbai")).toBe(false);
  });

  it("disagrees when one reader transcribes a genuinely different word", () => {
    // A real misread case: "mitochondria" vs "mitochondrion" is a small
    // difference in a short word, which SHOULD register as a real
    // disagreement worth flagging, not be smoothed over.
    expect(transcriptionsAgree("Paris", "Berlin")).toBe(false);
  });
});

describe("expectedVisibleText", () => {
  it("returns just the transcribed text when there is no detected label", () => {
    expect(expectedVisibleText(null, "Yen")).toBe("Yen");
  });

  it("prefixes the detected label onto the transcribed text", () => {
    expect(expectedVisibleText("Q3", "Yen")).toBe("Q3 Yen");
  });

  it("regression: matches what a crop-only reader sees when the label sits in the same region as the answer", () => {
    // Real bug found via claude-in-chrome verification (docs/TRACKER.md Phase 9):
    // GPT transcribed "Q3. Yen" from a crop whose Gemini transcribedText was
    // just "Yen" (label captured separately in detectedLabel per the schema),
    // producing a false mismatch until compared against the reconstructed text.
    const reconstructed = expectedVisibleText("Q3.", "Yen");
    expect(transcriptionsAgree(reconstructed, "Q3. Yen")).toBe(true);
    expect(transcriptionsAgree("Yen", "Q3. Yen")).toBe(false);
  });
});
