/**
 * Normalizes text for the handwriting cross-check comparison: collapses
 * whitespace, trims, and lowercases. This is intentionally lenient — the
 * check exists to catch genuinely DIFFERENT readings of the handwriting, not
 * to penalize cosmetic differences (capitalization, extra spaces) two models
 * are equally likely to format slightly differently.
 */
function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Levenshtein edit distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const distances: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) distances[i][0] = i;
  for (let j = 0; j < cols; j++) distances[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + cost,
      );
    }
  }

  return distances[rows - 1][cols - 1];
}

/**
 * Similarity ratio in [0, 1] between two strings, based on normalized
 * Levenshtein distance (1 = identical, 0 = completely different). Two empty
 * strings are treated as identical (ratio 1).
 */
export function similarityRatio(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  const maxLength = Math.max(normA.length, normB.length);
  if (maxLength === 0) return 1;
  return 1 - levenshteinDistance(normA, normB) / maxLength;
}

// Below this similarity ratio, two independent transcriptions of the same
// handwriting are considered a genuine disagreement worth flagging — not
// empirically tuned yet (see docs/TRACKER.md Phase 9), a reasoned starting
// point: short answers need near-exact agreement, longer ones can tolerate a
// little more per-character drift (e.g. one model reading a comma vs. a
// period) without being a real reading disagreement.
export const HANDWRITING_AGREEMENT_THRESHOLD = 0.85;

export function transcriptionsAgree(a: string, b: string): boolean {
  return similarityRatio(a, b) >= HANDWRITING_AGREEMENT_THRESHOLD;
}

/**
 * Reconstructs the full text Gemini's own bounding box likely contains, for
 * comparison against GPT's crop transcription. Gemini's schema deliberately
 * splits a written label ("Q3", "5(a)") from the answer content
 * (transcribedText) into separate fields — but GPT, given only the raw
 * cropped image with no awareness of that split, transcribes EVERYTHING
 * visible in the crop, label included. Comparing GPT's reading against
 * `transcribedText` alone was found (via real-browser verification, see
 * docs/TRACKER.md Phase 9) to produce a systematic false-mismatch whenever a
 * label sits inside the same visual region as the answer — not a genuine
 * handwriting disagreement. Recombining the two fields here makes the
 * comparison apples-to-apples.
 */
export function expectedVisibleText(detectedLabel: string | null, transcribedText: string): string {
  return detectedLabel ? `${detectedLabel} ${transcribedText}` : transcribedText;
}
