export function formatDisplayLabel(number: string, subpart: string | null): string {
  return subpart ? `${number} (${subpart})` : number;
}

/**
 * Generates a stable, URL-safe-ish synthetic id from a question's number and
 * optional subpart, e.g. "11" -> "q11", "11"+"a" -> "q11-a". Lowercases the
 * subpart and strips characters that aren't alphanumeric so odd printed
 * numbering (e.g. "II.", "7*") still produces a clean id.
 */
export function generateQuestionId(number: string, subpart: string | null): string {
  const cleanNumber = number.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const cleanSubpart = subpart?.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return cleanSubpart ? `q${cleanNumber}-${cleanSubpart}` : `q${cleanNumber}`;
}

/**
 * Asserts a list of questions is already in ascending "order" — this does
 * NOT re-sort by parsing the number/subpart as if it were always numeric
 * (that would break Roman numerals, lettered sections, and intentionally
 * skipped numbers per PRD §6). It exists only as a documented invariant
 * check: the model is instructed to already return questions in printed
 * order, and this function's job is to assert that invariant, not to
 * re-derive order from the numbering scheme itself.
 */
export function assertPrintedOrder<T extends { order: number }>(questions: T[]): T[] {
  for (let i = 1; i < questions.length; i++) {
    if (questions[i].order < questions[i - 1].order) {
      throw new Error(
        `Questions are not in ascending "order": index ${i} (order=${questions[i].order}) comes after index ${i - 1} (order=${questions[i - 1].order})`,
      );
    }
  }
  return questions;
}
