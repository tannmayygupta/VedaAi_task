# PRD — AI Assessment Extraction & Answer Mapping

Source spec: `initial.md` (VedaAI hiring assignment) + Figma design (file `hASwEgNoJjzlKnx9QxazY3`).
Tech stack / AI API choices already logged in `docs/DECISIONS.md`: Next.js (App Router, v16) + TypeScript +
Tailwind, deployed on Vercel; Google Gemini 2.5 Flash for all AI calls.

This document is the single source of truth for *what* gets built. Build order follows this
document top to bottom; each numbered feature section is a milestone that gets a `DECISIONS.md`
entry when a non-trivial implementation choice is made, and folds into `APPROACH.md` once done.

---

## 1. Goal & primary user story

> As a teacher, I upload a question paper and one student's handwritten answer sheet. The app
> extracts every question and every answer, matches them to each other, and shows them side by
> side — so that when I click a question, I instantly see *where* the student answered it
> (highlighted on the scan) and *how* they did.

Success = a teacher can look at the mapping screen for 30 seconds and know: what was answered,
where, and what wasn't answered at all — without reading the raw scan cover to cover.

---

## 2. Scope boundaries (explicit non-goals)

To keep this assignment-scoped and avoid silent scope creep:

- **One** question paper + **one** student's answer sheet per session (not batch/multi-student
  grading). Multi-student support is listed as a bonus idea in §8, not core.
- No accounts, no login, no persistence across browser sessions beyond in-memory/sessionStorage
  (per `CLAUDE.md`: no auth, no DB).
- No manual re-typing/editing of extracted question or answer *text* by the teacher (read-only
  extraction) — the only teacher interaction is navigating, expanding, and (optionally, bonus)
  re-linking a mis-mapped answer.
- English-language handwriting/print is the target; other languages are best-effort, not a
  tested requirement.
- Grading is **AI-suggested marks + feedback**, not a certified/authoritative grade — this must
  be stated as an assumption in the submission writeup.

---

## 3. End-to-end pipeline

```
Upload (question paper + answer sheet)
   → Question Extraction (from question paper)
   → Answer Extraction (from answer sheet, per page, with regions)
   → Answer Mapping (answer regions ↔ questions)
   → Grading & Feedback (per question + overall)
   → Mapping UI (question list ↔ highlighted answer sheet viewer)
```

Each stage below is a feature block: **description → inputs/outputs → UI behavior → edge cases →
acceptance criteria**.

---

## 4. Feature: File Upload

**Description:** Teacher uploads a question paper and an answer sheet, each independently, then
starts processing.

**Inputs:** Two files, uploaded independently via the two dropzones (matches Figma "Upload
Screen"):
- Question paper: PDF, or one or more images (JPG/PNG/WEBP) treated as ordered pages.
- Answer sheet: same accepted formats, multi-page/multi-image, since answers may span several
  pages.

**Constraints:**
- 10MB max per file (per Figma "Max 10MB" caption) — validate client-side before upload, reject
  with a clear inline error if exceeded.
- Accept multiple image files for a single slot (e.g., 4 photos of 4 pages) as well as a single
  multi-page PDF — internally both normalize to an **ordered list of page images**.

**Upload transport (corrected from the original naive design — see `docs/DECISIONS.md`
"Upload architecture correction"):** files do **not** get posted as `multipart/form-data`
straight to a Next.js API route. Vercel Functions cap request bodies at a hard, non-configurable
4.5MB — two ≤10MB files would exceed that immediately. Instead:
1. The client requests a short-lived upload token from a small API route
   (`/api/blob-upload-token`), whose own request/response bodies stay well under the limit.
2. The browser uploads the file **directly to Vercel Blob storage** using that token — the file
   bytes never pass through our own Function.
3. Once both files are uploaded, the client calls the processing route with just the two
   resulting Blob URLs (a tiny payload), and that route fetches the file bytes server-side before
   forwarding them to Gemini.

**UI behavior (Upload Screen — Empty/Filled states):**
- Empty state: two dashed dropzones, disabled "Start Mapping" button.
- On file select/drop: dropzone becomes a file chip (filename, size, page count, remove ✕
  button) — matches Figma "Filled State" exactly.
- "Start Mapping" button enables only when **both** files are present; disabled style/opacity
  otherwise (matches Figma disabled button at 25% opacity).
- Removing a file reverts that slot to the empty dropzone.

**Edge cases:**
- Wrong file type selected → inline error, do not accept the file.
- File exceeds 10MB → inline error naming the limit, do not accept the file.
- Corrupted/unreadable PDF → surface a clear error at the *extraction* step (see §9) rather than
  silently failing.

**Acceptance criteria:**
- Cannot proceed past this screen without both a valid question paper and a valid answer sheet.
- Visual states (empty/filled/disabled/enabled button) match the two Figma frames pixel-for-pixel
  in structure (colors, radii, spacing per the token table already logged).

---

## 5. Feature: Processing / Loading State

**Description:** While both documents are sent to Gemini and results are being assembled, show a
loading screen (matches Figma "Loading State").

**UI behavior:**
- Full-panel white card, centered animated sparkle icon, gradient "Extracting…" text (30px bold)
  + "This may take a while" (20px regular, muted) subtext, per the token spec already logged.
- Sidebar collapses to icon-only 64px rail during this state (matches Figma).
- This is a single combined step from the user's point of view even though under the hood it's
  two sequential AI calls (question extraction, then answer extraction+mapping — see §7).

**Edge cases:**
- Extraction takes unusually long (>25–30s) → keep the loader but consider a soft "still
  working…" secondary message so the teacher doesn't think it's frozen (bonus polish, §8).
- Extraction fails outright (API error, quota, unreadable file) → route to an error state, not an
  infinite spinner (see §9).

**Acceptance criteria:** Loading screen shows immediately on "Start Mapping" click and is
replaced by either the mapping screen (success) or a clear error (failure) — never stalls
silently.

---

## 6. Feature: Question Extraction

**Description:** Extract every question from the question paper, in printed order, preserving
original numbering, with labelled sub-parts treated as separate entries.

**Inputs:** Ordered question-paper page images/PDF (native PDF passed directly to Gemini where
possible).

**Output — `Question` schema:**
```ts
interface Question {
  id: string;            // stable synthetic id, e.g. "q11-a"
  number: string;        // printed top-level number, e.g. "11"
  subpart: string | null;// "a" | "b" | ... | null if no sub-part
  displayLabel: string;  // "11 (a)" — exactly as shown in the UI
  text: string;          // full extracted question text
  marksTotal: number | null; // if the paper states marks (e.g. "[2]"); null if not stated
  pageIndex: number;     // 0-based page in the question paper where it appears
  order: number;         // absolute printed order, used for sorting/display
}
```

**Extraction rules (must be followed exactly per `initial.md`):**
1. Extract questions in the **exact printed order**.
2. A labelled sub-part (`11 (a)`, `11 (b)`) is a **separate entry**, not merged into its parent.
3. **Preserve original numbering** verbatim in `displayLabel` — don't renumber sequentially if
   the paper skips numbers or uses non-numeric schemes (e.g., Roman numerals, lettered
   sections) — `number`/`subpart` should capture whatever scheme the paper actually uses.
4. If the paper states marks per question (e.g. "[2 marks]"), capture `marksTotal`; if it does
   not, leave `marksTotal: null` (grading later falls back to a model-estimated rubric — see §8
   for the marks-inference bonus).

**UI behavior:** Populates the left panel's card list (see §10) once mapping is also ready — not
shown standalone before answers are mapped, since the design always shows question + score
together.

**Edge cases:**
- Multi-column or multi-page question papers → page-order and reading-order must still resolve
  to correct printed order (this is why the raw PDF/pages go to the model rather than pre-OCR'd
  plain text, so layout is preserved).
- Instructions/preamble text (not actual questions) must not be extracted as a question.
- A question with a diagram/figure embedded → text extraction should still succeed; the diagram
  itself doesn't need to be reproduced, just referenced if the question explicitly says "see
  diagram."

**Acceptance criteria:** Given a paper with N printed questions/sub-parts, the extracted list has
exactly N entries, in the same order, with numbering matching the source paper exactly.

---

## 7. Feature: Answer Extraction + Mapping (combined)

This is the highest-risk, highest-value feature — it's directly responsible for 3 of the 6
"What We Evaluate" criteria in `initial.md` (answer mapping accuracy, highlighting correctness,
edge-case handling).

**Approach:** Rather than extracting answers "blind" and matching them afterward as a separate
pass, the answer-sheet call is given the already-extracted question list (numbers + text) as
context in the same request, and asked to directly segment the answer sheet into regions, each
tagged with the question it answers (if determinable). This collapses "extract answers" +
"match answers to questions" into one model call, which is both more accurate (the model sees
both documents at once, the same way a human grader would) and simpler to build than a
two-pass extract-then-fuzzy-match pipeline.

**Inputs:** Ordered answer-sheet page images/PDF + the `Question[]` list from §6.

**Output — `AnswerRegion` schema:**
```ts
interface AnswerRegion {
  id: string;
  pageIndex: number;          // 0-based page in the ANSWER SHEET
  boundingBox: {              // normalized 0–1000, Gemini's native grounding format
    yMin: number; xMin: number; yMax: number; xMax: number;
  };
  transcribedText: string;    // best-effort transcription of the handwriting in this region
  detectedLabel: string | null; // what the student wrote as a label, e.g. "Q2", "11 b", if any
  matchedQuestionId: string | null; // id from Question[], or null if unmatched
  matchConfidence: number;    // 0–1
  continuesFromRegionId: string | null; // set when an answer spills onto a later page/region
}
```

**Matching logic (in priority order, all done by the model in one pass, not separate app code):**
1. **Explicit label match** — student wrote "Q2"/"2."/"11(b)" etc. next to their answer → match
   directly to that question's `number`+`subpart`.
2. **Positional/sequential inference** — no label, but the answer clearly follows the previous
   matched answer in sequence on the page → infer the next unanswered question in order.
3. **Semantic content match** — no label and no clear sequence (e.g., answers given out of
   order) → match based on whether the answer content actually addresses a specific question's
   topic.
4. **No match found** → `matchedQuestionId: null`, region still returned and still shown to the
   teacher (see "unmatched answers" edge case below) rather than silently dropped.

**Multi-page answers:** if a region's content is clearly a continuation of a prior region's
answer (same question, spills across a page break), `continuesFromRegionId` links them; the UI
treats them as one logical answer spanning multiple highlighted regions across pages (see §10).

**Edge cases (explicit requirements from `initial.md`):**
| Case | Handling |
|---|---|
| Answers out of order (student answers Q5 before Q3) | Matching is by label/content, not by position on page — order of answers on the sheet has no bearing on which question they map to. |
| Unanswered question | `Question` has no `AnswerRegion` pointing to it → shown as "Unanswered" in the UI (§10), not hidden. |
| Answer with no matching question | Region kept with `matchedQuestionId: null`; surfaced in the UI as an "Unmatched" callout rather than silently discarded — a teacher should be able to see "the student wrote something here that doesn't match any question" (e.g. extra work, a crossed-out attempt, mislabeled answer). |
| Answer spans multiple pages | Linked via `continuesFromRegionId`; highlighting shows a region on every page it spans, and clicking the question jumps through all of them. |
| Illegible/ambiguous handwriting | Low `matchConfidence` and/or `transcribedText` includes a best-effort partial transcription; UI should visually flag low-confidence matches (see bonus §8) rather than presenting them with false certainty. |
| Answer sheet has no name/header answers, doodles, scratch work | Not everything on the page is a question answer — the model should not force-map irrelevant marks to the nearest question; unmatched/ignored content is acceptable. |

**Acceptance criteria:**
- Every question either has ≥1 linked `AnswerRegion` or is correctly shown as unanswered.
- Every `AnswerRegion` either has a `matchedQuestionId` or is correctly surfaced as unmatched —
  none are silently dropped.
- Bounding boxes visually align with the actual handwritten answer on the rendered page (allow
  for "best effort," not pixel-perfect — see risk already logged in `DECISIONS.md`).

---

## 8. Feature: Grading & Feedback

**Description:** Per-question score + correctness + AI feedback, plus an overall summary —
explicitly in scope per `initial.md` ("Important (Scope)").

**Output — extends per question:**
```ts
interface Grading {
  questionId: string;
  marksAwarded: number;
  marksTotal: number;          // from Question.marksTotal if present, else a model-assigned default (e.g. 2)
  correctness: "correct" | "partial" | "incorrect" | "unanswered";
  feedback: string;            // 1–2 sentence AI feedback, matches Figma "AI Feedback" panel copy style
}
```

**Overall summary:** total marks awarded / total possible, displayed prominently (this directly
answers `initial.md`'s "clear grading summary" requirement) — e.g. a header stat or banner above
the question list: **"18 / 25 (72%)"**, plus a count of unanswered/unmatched items so the teacher
sees the full picture at a glance, not just a percentage.

**UI behavior (Question list cards, per Figma "Question - Answer mapping screen"):**
- Score pill per question, color-coded by performance: green tint (`rgba(69,181,41,0.1)` /
  `#34AC15` text) for full marks, amber (`rgba(255,153,0,0.1)` / `#E3600F`) for partial, red
  (`#FFE9E2` / `#C0350A`) for zero/incorrect — thresholds: full = green, 0 = red, anything
  in-between = amber.
- Unanswered questions get a distinct neutral/grey pill ("Unanswered") rather than a 0-score red
  pill, so "didn't answer" is visually distinguishable from "answered incorrectly."
- Expanding a card reveals the "AI Feedback" panel (light-grey rounded block, per Figma).
- Selected/expanded question card gets the orange 2px border treatment (matches Figma's
  expanded-card state).

**Edge cases:**
- `marksTotal` unknown (paper didn't state marks) → default to a flat rubric (e.g. out of 2) and
  note in the UI that this is an assumed weight, not extracted from the paper.
- Unanswered questions are always `marksAwarded: 0`, `correctness: "unanswered"` — never silently
  omitted from the total.
- Unmatched answers are not graded against anything (nothing to grade them against) but should
  still be visible somewhere (see §10 "Unmatched Answers" panel).

**Acceptance criteria:** Overall summary total exactly equals the sum of all per-question
`marksAwarded`/`marksTotal`, including zeros for unanswered questions.

---

## 9. Feature: Mapping Screen UI (the core screen)

Maps to Figma node `1:8890`. Two-panel layout inside the shared app shell (sidebar + top bar,
already documented from Figma).

**Left panel — Question list:**
- Header: "Extracted Questions (from question paper)" + overall score summary (see §8) +
  "Expand All" toggle button.
- Scrollable list of question cards in printed order (per §6), each showing: number/sub-part
  badge, question text, score pill, unanswered/unmatched state, expand chevron.
- Clicking a card:
  1. Expands it (shows AI Feedback).
  2. Scrolls/jumps the right panel to the first page containing that question's answer region.
  3. Draws the highlight overlay(s) for that question's `AnswerRegion`(s).
  4. If the question is unanswered, right panel shows a clear "No answer found for this question"
     state instead of a highlight.

**Right panel — Answer Sheet viewer:**
- Dark header: "Answer Sheet" title, zoom control (−/100%/+), page navigator ("‹ Page X of N ›").
- Renders the current answer-sheet page as an image.
- Highlight overlay: absolutely-positioned div per matched region, converted from the model's
  normalized 0–1000 bbox to a percentage of the rendered image's displayed dimensions (so it
  stays correctly aligned at any zoom level) — 2px solid `#3DD218` border, `rgba(94,255,53,0.1)`
  fill, 16px radius, with a small green pill tag (`#34AC15` bg) showing the question label (e.g.
  "Q2") anchored above the box top-left corner — matches Figma exactly.
- Multi-page answers: navigating to any page that has a region for the currently-selected
  question shows that page's portion highlighted too.

**Unmatched Answers panel (new, not literally in the Figma mockup but required by
`initial.md`'s "answers that don't match any question" requirement):** a collapsible section
(e.g. below the question list, or a filter/tab) listing `AnswerRegion`s with
`matchedQuestionId: null` — each still clickable to jump to and highlight that region on the
answer sheet, so nothing extracted is ever invisible to the teacher.

**Acceptance criteria:**
- Clicking any question always produces a deterministic, correct highlight (or a clear
  "unanswered" state) — no dead clicks.
- Highlight position visually tracks the actual answer text/region within a reasonable margin.
- Nothing extracted from the answer sheet is unreachable from the UI (matched answers via their
  question; unmatched answers via the unmatched panel).

---

## 10. Feature: Error & Empty States

Not explicitly in the Figma mockups but required for a real product and for a good "quality of
implementation" score:

- **Upload validation errors** (wrong type, too large) — inline on the dropzone.
- **Extraction failure** (API error, timeout, unreadable file) — full-panel error state with a
  "Try Again" action that returns to the upload screen with files retained.
- **Partial extraction** (e.g. question extraction succeeded, answer extraction failed) — treat
  as a full failure for this MVP (don't show a half-populated mapping screen) — retry the whole
  pipeline.
- **Empty results** (e.g. question paper had zero detected questions) — explicit "couldn't find
  any questions in this file" message, not a blank list.

---

## 11. Non-functional requirements

- **No auth, no DB** — all state lives in the browser for the duration of the session (React
  state); nothing is persisted server-side beyond the lifetime of a single API request.
- **File size:** 10MB/file max (client-validated).
- **Formats:** PDF (multi-page) or JPG/PNG/WEBP (single or multiple, page-ordered) for both
  slots.
- **Deployment:** live URL on Vercel; public GitHub repo.
- **Performance target:** end-to-end extraction+mapping should complete in well under a minute
  for a typical 1–2 page question paper and 4–6 page answer sheet (matches the "This may take a
  while" framing in the Figma loading state — a *bit* of wait is expected and designed for, not
  hidden).
- **Browser support:** modern evergreen browsers (Chrome/Edge/Firefox/Safari, latest 2
  versions) — no legacy IE/old-Safari support needed.

---

## 12. Bonus / "brownie point" add-ons

Everything below is **out of core scope** but flagged because it either directly reinforces an
explicit evaluation criterion in `initial.md` or is very cheap given what's already being built.
Ranked by effort; do these only after §4–§11 are solid and only in this order.

| # | Add-on | Effort | Why it's cheap / valuable |
|---|---|---|---|
| 1 | **Overall grade summary banner** ("18/25 · 72% · 2 unanswered") prominently at the top of the mapping screen | Trivial (data already computed in §8) | Directly satisfies `initial.md`'s explicit "clear grading summary" callout — do this as part of core, not really optional. |
| 2 | **Confidence flag on low-confidence matches** — a small "verify" badge on any question/answer pair below a confidence threshold | Trivial (confidence already returned by the model per §7) | Turns a known limitation (imperfect handwriting OCR/matching) into a visible trust signal instead of a silent failure mode — good interview talking point. |
| 3 | **sessionStorage persistence** of the extraction/mapping result | Small | Refreshing the tab shouldn't lose a completed extraction; fits the "in-memory only" constraint (no server DB needed) while improving UX for free. |
| 4 | **Export graded report** (download a simple PDF or Markdown summary: per-question marks + feedback + overall score) | Small–Medium (client-side, e.g. `window.print()`-friendly view or a lightweight PDF lib) | Directly extends "AI feedback / grading summary" into something a teacher could actually save or hand to a student — high perceived value for low effort. |
| 5 | **Keyboard navigation** (↑/↓ to move between questions, ←/→ to flip answer-sheet pages) | Small | Reuses UI already being built (page navigator, question list); nice polish for "overall product experience" scoring. |
| 6 | **Export raw extraction as JSON** (questions + answers + mapping) | Trivial | Useful for debugging/demo during the interview; shows the data model clearly. |
| 7 | **Manual re-link of a mis-mapped answer** (teacher clicks a question, then clicks a different region on the answer sheet to reassign it) | Medium | Real value (corrects AI mistakes) but non-trivial interaction design — only attempt if core pipeline is done early with time to spare. |
| 8 | **Mobile-responsive layout** | Medium (Figma already has phone frames drawn, so tokens/spacing are known, but it's still real implementation work across every screen) | Only worth doing if time remains — assignment only requires "a web page," desktop-first is fully compliant. |

Do **not** attempt: multi-student batch grading, accounts/history, non-English language
guarantees, or authoritative (non-AI) grading — all explicitly out of scope per §2.

---

## 13. Data flow summary (for the build itself)

```
Browser ──(direct upload, bypasses our Function body limit)──▶ Vercel Blob
Browser ──(blob URLs only, tiny payload)──▶ /api/extract-and-map-answers

Question[]  ──┐
              ├──▶ single Gemini call (answer sheet + Question[] as context) ──▶ AnswerRegion[]
Answer sheet ─┘                                                                        │
   (fetched server-side from its Blob URL)                                            ▼
                                                                      Grading[] (per matched question,
                                                                      via transcribedText + question text)
```

Two Gemini calls total per session:
1. Question paper → `Question[]`.
2. Answer sheet + `Question[]` → `AnswerRegion[]` (extraction + mapping combined, per §7).
Grading (§8) can either be a third call, or folded into call #2's response schema (grade each
matched region as part of the same response) — **folding it into call #2 is preferred**: fewer
round-trips, and the model already has both question text and the transcribed answer in front of
it at that point, which is exactly what grading needs.

---

## 14. Milestone → evaluation-criteria mapping

Direct traceability to `initial.md`'s "What We Evaluate" list, so each milestone's completion is
also a checkpoint for submission-readiness:

| Evaluation criterion | Covered by |
|---|---|
| Accuracy of question extraction | §6 |
| Accuracy of answer mapping | §7 |
| Correct highlighting of answers | §7 (bounding boxes) + §9 (overlay rendering) |
| Handling of edge cases | §7 edge-case table + §10 |
| Quality of implementation | §11 + error handling in §10 |
| Overall product experience | §9 UI + §12 bonus polish |

---

## 15. Open questions for the user

None blocking — all upload/GitHub/grading-scope questions already resolved (see chat history).
If anything below turns out to need a call during implementation, it'll be logged in
`DECISIONS.md` and flagged inline rather than assumed silently:
- Exact default marks-per-question when the paper doesn't state marks (currently proposed: 2).
- Confidence threshold for the "low confidence / verify" bonus flag (currently proposed: <0.6).
