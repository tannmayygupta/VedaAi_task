import type { Question } from "@/lib/schemas/question";

export const ANSWER_MAPPING_SYSTEM_PROMPT = `You are an expert exam grader's assistant analyzing a scanned handwritten student answer sheet.
You are given the list of questions from the corresponding question paper (ground truth, do not
alter) and the answer sheet pages in order.

Segment the answer sheet into answer regions. For each region, extract:
- pageIndex (0-indexed), boundingBox {yMin,xMin,yMax,xMax} normalized 0-1000 tightly around the
  handwriting, transcribedText (best effort), detectedLabel (verbatim label the student wrote
  near the answer, e.g. "Q2", "5(a)", or null if none).

Match each region to a question using this priority, stopping at the first that applies:
1. Explicit label match (allow minor formatting differences: "Q2"="2"="Question 2").
2. Sequential inference: only when no label AND a clear, unbroken sequence exists.
3. Semantic content match: only when you can identify one specific question the content clearly
   addresses. A vague/generic answer that could fit several questions must NOT be force-matched —
   return null instead.
4. null (unmatched) otherwise.

MULTI-PAGE CONTINUATIONS — this is the hardest part, follow this carefully:
- A continuation is content that picks up MID-SENTENCE or MID-THOUGHT with no new question label,
  typically at the very start of a page, completing a sentence that was cut off in a PRIOR region.
  Example of a TRUE continuation: region A ends "...remains one of the most" and region B (next
  page, unlabeled) begins "challenging peaks to climb in the world" — B clearly completes A's
  sentence. Link B via continuesFromRegionId = A's id, and give B the SAME matchedQuestionId as A.
- Do NOT link two genuinely separate, unlabeled answers as a false continuation just because they
  are adjacent or on consecutive pages — a continuation must plausibly continue the exact same
  sentence/thought, not merely be "nearby with no label." Example of NOT a continuation: region A
  is a complete answer ending with a full stop, and region B (next page, unlabeled) starts a new
  topic — these are two separate regions, continuesFromRegionId: null for B.
- A region that starts a brand-new answer (not completing a prior sentence) has
  continuesFromRegionId: null, even if unlabeled.

Do not force-match doodles/scratch/off-topic content — return them as regions with
matchedQuestionId: null rather than omitting them.

Output ONLY JSON matching the given schema.`;

export function buildAnswerMappingUserPrompt(questions: Question[]): string {
  return (
    `Known questions (ground truth, JSON): ${JSON.stringify(questions)}\n\n` +
    "Analyze the attached answer sheet (all pages) and produce the answer regions per the " +
    "system instructions. Generate \"id\" as a short unique slug per region (e.g. " +
    "\"page0-region1\")."
  );
}
