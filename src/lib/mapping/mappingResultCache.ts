import type { MappingData } from "./useMappingData";

function cacheKey(questionPaperUrl: string, answerSheetUrl: string): string {
  return `vedaai:mapping-result:${questionPaperUrl}|${answerSheetUrl}`;
}

/**
 * Caches a completed mapping result in sessionStorage so refreshing the
 * mapping screen doesn't lose it and re-run the whole AI pipeline. Scoped to
 * the browser tab's session (matches the project's in-memory-only, no-DB
 * constraint) and degrades silently if storage is unavailable (private
 * browsing, quota exceeded) — the feature just falls back to always
 * re-fetching, which is already correct behavior.
 */
export function readMappingCache(
  questionPaperUrl: string,
  answerSheetUrl: string,
): MappingData | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(questionPaperUrl, answerSheetUrl));
    return raw ? (JSON.parse(raw) as MappingData) : null;
  } catch {
    return null;
  }
}

export function writeMappingCache(
  questionPaperUrl: string,
  answerSheetUrl: string,
  data: MappingData,
): void {
  try {
    sessionStorage.setItem(cacheKey(questionPaperUrl, answerSheetUrl), JSON.stringify(data));
  } catch {
    // ignore
  }
}
