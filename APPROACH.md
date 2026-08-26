# Approach

This is the submission writeup: what was built, why each non-trivial choice was made, and known
assumptions/limitations — in plain language, with "why not X" called out for every major choice.

## Summary

A teacher uploads a question paper and a student's (typically handwritten) answer sheet. The app
extracts every question in printed order, extracts and transcribes every answer, maps each answer
to the question it answers (including out-of-order, unlabeled, and multi-page answers), highlights
the exact answer region on the original scanned page, and grades each answer with marks and
feedback. Everything runs client + serverless — no database, no accounts, no persistence beyond
one browser session.

## Stack & AI model used

**Next.js (App Router, v16) + TypeScript + Tailwind CSS, deployed on Vercel.** One project, no
separate backend: Next.js API routes are enough for the upload → extract → map → grade pipeline
given the no-DB/no-auth constraint, and Vercel is a one-command deploy that satisfies the "live
URL" requirement with minimal ops.

**Google Gemini (`gemini-3.6-flash`, via `@google/genai`)** is the only AI model/API used, for
question extraction, answer extraction, answer-to-question mapping, and grading.

**Why Gemini and not GPT-4o or Claude:** the core UI requirement is highlighting the *exact
region* of a handwritten answer on the scanned page. Gemini's vision models return **normalized
bounding boxes** (`[yMin, xMin, yMax, xMax]`, 0–1000) for detected content as a first-class,
documented capability — not a workaround. Neither GPT-4o nor Claude's vision models offer that
same native region-grounding for arbitrary document content, which would have meant estimating
box placement heuristically and directly undermining the "exact region" requirement. Gemini also
accepts native multi-page PDF input, so both documents go in as-is with no PDF-to-image conversion
step. (A local/open-source OCR + custom layout model was also considered and rejected: getting
handwriting-OCR accuracy and bounding boxes right from scratch is far more effort than an
assignment timeline justifies, and still wouldn't match a frontier multimodal model's handwriting
recognition.)

## Pipeline

**Call 1 — Question extraction.** The question paper (native PDF or image) goes to Gemini with a
prompt that: states an explicit rule-priority order, includes a worked example for the trickiest
rule (splitting labelled sub-parts like 11(a)/11(b) into separate questions), and instructs the
model to mentally enumerate every question before producing output. `id` and `displayLabel` for
each question are then **recomputed server-side** from `number`/`subpart` — never trusted verbatim
from the model — since those two fields are 100% mechanically derivable and a real-API run once
surfaced a harmless-but-inconsistent formatting slip (`"5(a)"` vs `"5 (a)"`) that this eliminates
entirely rather than trying to prompt away.

**Call 2 — Answer extraction + mapping + grading, combined.** The already-extracted `Question[]`
list is passed back to Gemini alongside the answer sheet, and one prompt does three things in
sequence: (a) transcribe every visible answer region, (b) match each region to a question using a
priority order — explicit student-written label first, then sequential/positional inference, then
semantic content match, else leave unmatched — and (c) grade each question (marks + correctness +
feedback), including unanswered ones, so nothing is ever silently missing from the result.

**Why one combined call instead of three separate ones:** a human grader reads both documents
together and matches/grades in one pass, not by OCR'ing the answer sheet blind and fuzzy-matching
afterward. Giving the model both documents in one context window lets it use the same signal a
human would. It also means grading happens with the transcribed handwriting already in front of
the model, avoiding a second round-trip that would just re-derive context the model already has.
The trade-off: a single large call is harder to unit-test in isolation than separate steps —
mitigated by still modeling extraction, mapping, and grading as distinct typed objects
(`AnswerRegion`, `Grading`) so each can be inspected independently even though they come from one
call.

**Highlighting.** Bounding boxes are stored in Gemini's native normalized 0–1000 format and
rendered client-side as absolutely-positioned overlays converted to a **percentage** of the
rendered image/canvas's displayed size — not baked into a fixed-pixel canvas. This keeps the
highlight correctly aligned at any zoom level or container width, since it scales with the
rendered element instead of a pixel grid captured once at extraction time. PDF answer sheets are
rasterized client-side via `pdfjs-dist` to a `<canvas>` (worked around a known Turbopack/pdfjs
worker-loading bug by copying the worker file into `public/` at install time); the same
percentage-based overlay draws on top of that canvas exactly as it does for plain-image answer
sheets, with no changes needed — confirming the original percentage-coordinate design choice paid
off when a second rendering path (PDF vs. image) was added later.

**Structured output validation.** Every Gemini call expecting JSON goes through Zod's
`safeParse`; on failure, the *same* call is retried exactly once with a correction note describing
what was wrong, and if still invalid, a typed `"malformed-response"` error is returned rather than
throwing or silently accepting bad data. One bounded retry is a deliberate middle ground: cheap
(at most 2x calls), gives the model a real chance to self-correct with concrete feedback, and has
a hard stop so a genuinely broken response fails loudly instead of looping.

## Key decisions (why not X)

- **Direct client-to-Vercel-Blob upload, not a POST to our own API route.** Vercel Functions
  enforce a hard, non-configurable 4.5MB request-body limit — two files up to 10MB each (the
  limit the Figma design itself advertises) would blow that immediately. Files upload straight
  from the browser to Blob storage using a short-lived client token; the processing route only
  ever receives the resulting Blob URL. Rejected alternatives: lowering the advertised file-size
  limit (breaks Figma fidelity and pushes teachers toward lossy compression, directly hurting
  OCR accuracy — the app's core value), and client-side compression (same OCR-accuracy risk).
- **Multi-image answer sheets are merged into one PDF client-side before upload**, rather than
  sending Gemini a "bag of N images" and asking it to sequence them. Gemini's multi-image support
  doesn't officially guarantee array order maps to page order, whereas real scanning products
  (Adobe Scan, CamScanner, etc.) universally merge multi-photo captures into a single PDF before
  anything reaches a backend — this reuses the entire already-verified single-PDF pipeline
  (page indexing, per-page bounding boxes) with zero new server-side logic.
- **No CI; Vitest + RTL for deterministic logic, real Gemini calls (not mocks) for
  extraction/mapping accuracy, claude-in-chrome for visual/E2E verification.** App logic (math,
  validation, state) is fully testable and automated. Model output quality is *not* something a
  mock can validate — only the real model against real documents proves the actual value
  proposition works, which is what the assignment is graded on.

## Edge cases handled

- Labelled sub-parts (e.g. 11(a)/11(b)) treated as separate questions, verified 100% accurate
  against three adversarial synthetic question papers (basic sub-part split, a numbering gap +
  Roman-numeral section, five different marks notations).
- Out-of-order answers — matched via label-first / positional / semantic priority, not assumed
  to follow question order.
- Unanswered questions — always present in the final grade book with 0 marks, never silently
  dropped.
- Answers that don't match any question — left `matchedQuestionId: null` and surfaced separately
  in the UI rather than force-matched.
- Multi-page answers — a single answer spanning a page boundary is tracked by `pageIndex` per
  region and the UI navigates to the correct page; verified against a real fixture where one
  question's answer splits across two pages.
- Zero-question or zero-answer extraction results get real empty-state UI, not a blank/broken
  screen.

## Assumptions & limitations

- **Handwriting OCR is inherently imperfect.** Messy handwriting, crossed-out text, or diagrams
  may be mis-transcribed. Bounding boxes are the model's own visual grounding ("best-effort exact
  region"), not pixel-perfect coordinates.
- **Match-confidence scores aren't reliably calibrated by match method.** Real testing showed the
  model doesn't consistently follow its own confidence-banding instructions (e.g. semantic-only
  matches sometimes score as high as label matches) even though the matches themselves were 100%
  correct across all tested fixtures. A "low-confidence review" flag should not be read as "this
  match was made by inference vs. an explicit label."
- **`DEFAULT_MARKS_WHEN_UNSTATED = 2`** is a judgment call (per the PRD's own suggested example),
  not derived from the source documents — it affects the total score whenever a question paper
  doesn't state marks for a question.
- **Single AI provider.** Everything depends on Gemini; a Gemini outage or free-tier quota
  exhaustion stops the app entirely. Acceptable for an assignment/demo; production use would need
  a fallback provider.
- **No auth, no database, in-memory only** — by design, per the assignment's own constraints.
  Results exist only for the current browser session (with an optional sessionStorage cache for
  the current tab); nothing persists across sessions or devices.
- **Recommend a single multi-page PDF per upload slot** for best results — multiple photos for
  one slot are merged into a PDF client-side automatically, so this is handled, not a manual
  workaround the teacher needs to do.
