# Decision Log

Raw, append-only log of every non-trivial decision made while building this project, and why.
See `CLAUDE.md` for the logging rule. This feeds `APPROACH.md` (the polished writeup) at
milestones.

## [2026-08-26] Tech stack: Next.js + TypeScript + Tailwind, deployed on Vercel
**Decision:** Next.js (App Router, currently v16) + TypeScript + Tailwind CSS for the whole app (single
project, API routes for extraction/mapping logic, no separate backend service). Deploy to
Vercel.

**Why:**
- The Figma design context tool exports its reference implementation as React + Tailwind
  directly off the file's own design tokens (colors, spacing, radii all as literal Tailwind
  classes) — building in Next.js + Tailwind lets that reference code be adapted almost directly
  instead of hand-translated into a different styling system, cutting UI-fidelity risk.
- Next.js API routes are enough to host the upload → extract → map pipeline; no separate backend
  needed given the no-DB, no-auth, in-memory constraint from `CLAUDE.md`.
- Vercel is a one-command deploy for Next.js with a free tier, satisfying the "must be deployed
  to a live URL" requirement with minimal ops overhead.

**Alternatives considered:**
- Plain React (Vite) + Express backend — more moving parts (two deploy targets, CORS) for no
  real benefit at this scale.
- Vue/Svelte + a different backend — would require hand-porting every Figma-exported
  React/Tailwind reference into a different framework's syntax, pure extra translation risk
  with zero upside for a solo/short-timeline assignment.

**Trade-offs / risks:**
- Vercel's serverless function execution time/payload limits could be tight for large PDF
  uploads + multi-page vision-model calls; may need to stream/chunk or move heavy extraction to
  an async route if this becomes a problem.
- Everything in one Next.js app means the extraction pipeline shares a process with the UI —
  acceptable for an assignment-scale, single-session tool with no concurrent multi-tenant load.

## [2026-08-26] AI API: Google Gemini (2.5 Flash) for extraction, mapping, and grading
**Decision:** Use the Gemini API (`gemini-2.5-flash`, via `@google/genai`) as the sole AI
model/API for question extraction, handwritten-answer extraction, answer-to-question mapping,
and grading/feedback.

**Why:**
- The Figma design's core screen requires highlighting the **exact region** of a handwritten
  answer on the answer-sheet image (visible in the "Question - Answer mapping screen" node
  1:8890 — a bounding-box overlay with a floating "Q2" tag drawn directly on the scanned page).
  Gemini's vision models natively return **bounding boxes** for detected content in a
  normalized `[ymin, xmin, ymax, xmax]` (0–1000) JSON format when asked — this is a first-class,
  documented capability, not a workaround.
- Gemini accepts **native PDF input** (multi-page, layout-aware) in addition to images, so both
  the question paper and multi-page answer sheets can be sent directly without a separate
  PDF-to-image conversion step in most cases.
- Google AI Studio's Gemini API free tier is generous enough for an assignment-scale
  (single-session, few-requests) workload, satisfying the "any AI model/API with a free tier"
  constraint.
- One model handles the entire pipeline (extraction → mapping → grading) via structured JSON
  output (response schema / JSON mode), avoiding the complexity of stitching together multiple
  providers.

**Alternatives considered:**
- OpenAI GPT-4o/4.1 (vision) — strong OCR and reasoning, but no first-class bounding-box
  grounding for arbitrary document regions; would require heuristic/estimated box placement,
  directly undermining the "exact region" highlighting requirement.
- Anthropic Claude (vision) — good document/vision understanding, but same gap: no native
  normalized bounding-box output for general document regions, and PDF handling is page-image
  based rather than a single native multi-page input.
- Running a local/open-source OCR (Tesseract, TrOCR) + custom layout model — far more effort to
  get handwriting OCR accuracy and layout/bounding boxes right than an assignment timeline
  justifies, and still wouldn't match a frontier multimodal model's handwriting recognition
  quality.

**Trade-offs / risks:**
- Handwriting recognition accuracy from any model (including Gemini) is inherently imperfect;
  messy handwriting, crossed-out text, or diagrams may be mis-transcribed or mis-boxed. This is
  a known limitation to call out explicitly in the submission's "assumptions/limitations"
  section rather than something to silently paper over.
- Bounding boxes are the model's own visual grounding, not pixel-perfect OCR coordinates — they
  should be treated as "best effort exact region," with the UI drawing a clearly visible
  highlight box rather than assuming sub-pixel precision.
- Coupling the whole pipeline to one provider (Gemini) means a Gemini outage or free-tier quota
  exhaustion stops the app entirely; acceptable for an assignment/demo, but would need a fallback
  provider for production use.

## [2026-08-26] Answer mapping algorithm: single combined extract+match Gemini call, not a separate matching pass
**Decision:** Extract answer regions and map them to questions in one Gemini call, by passing the
already-extracted `Question[]` list as context alongside the answer sheet, and asking the model
to directly output each answer region's `matchedQuestionId`. Priority inside that single call:
(1) explicit student-written label match (e.g. "Q2"), (2) sequential/positional inference when no
label is present, (3) semantic content match as a last resort, (4) `null` (unmatched) if none
apply. Full schema in `docs/PRD.md` §7.

**Why:** A human grader matches answers to questions by reading both documents together, not by
OCR'ing the answer sheet blind and then fuzzy-matching text afterward. Giving the model both
documents in one context window lets it use the same signal (explicit labels, sequence, content)
a human would, in one pass, instead of building a separate app-side matching/scoring layer on top
of two independent extractions.

**Alternatives considered:**
- Two independent extractions (questions, then answers) + app-side matching (e.g. embedding
  similarity or string matching on labels) — more moving parts, another algorithm to tune and
  debug, and strictly less context than letting the model see both documents at once.
- Rule-based label matching only (regex for "Q2", "11(b)", etc.) with no semantic fallback —
  would fail the explicit "handle answers out of order" and "unmatched answers" requirements
  whenever a student doesn't label an answer, which is common with handwritten sheets.

**Trade-offs / risks:**
- A single large combined call is harder to unit-test/debug in isolation than separate
  extraction and matching steps — mitigated by still modeling `AnswerRegion` as its own typed
  object with its own confidence score, so mapping quality can be inspected independently of
  extraction quality even though they come from one call.
- If the question list is large, the combined prompt gets longer, which could affect latency —
  acceptable at assignment scale (single question paper, single answer sheet).

## [2026-08-26] Highlighting mechanism: normalized 0–1000 bbox → percentage-based absolute overlay
**Decision:** Store bounding boxes in Gemini's native normalized `[yMin, xMin, yMax, xMax]`
(0–1000) format, and render highlights client-side as absolutely-positioned `<div>` overlays
converted to a percentage of the rendered image's displayed width/height — not baked into a
fixed-pixel canvas or drawn server-side into the image.

**Why:** Percentage-based overlays stay correctly aligned regardless of the zoom level set by the
Figma-specified zoom control (−/100%/+) or the container's responsive width, since they scale
with the image element rather than a fixed pixel grid captured at extraction time.

**Alternatives considered:**
- Server-side image annotation (burn the highlight into a new image with a drawing library) —
  loses the ability to toggle/zoom/re-highlight different questions without re-generating images
  per click; far more server work for a strictly worse interaction.
- Absolute-pixel overlay coordinates computed once at load time — breaks on zoom/resize unless
  recalculated on every viewport change; percentage-based avoids that recalculation entirely.

**Trade-offs / risks:** Percentage conversion assumes the rendered `<img>` preserves aspect ratio
with `object-fit: contain` (or equivalent) — any layout that distorts the image's aspect ratio
would misalign the overlay; the viewer implementation must guarantee aspect-ratio-preserving
rendering.

## [2026-08-26] Testing strategy: Vitest+RTL for logic, claude-in-chrome for E2E/visual, real Gemini calls for accuracy, no CI
**Decision:** Development proceeds in phases (see `docs/TRACKER.md`), gated by tests before
moving on. Testing is split by what's actually deterministic:
- **Vitest + React Testing Library** for anything deterministic: file validation, the
  normalized-bbox-to-percentage conversion math, score/marks aggregation, schema parsing, and the
  answer-matching priority logic run against saved fixture model responses.
- **claude-in-chrome** (agent-driven browser automation), not a maintained Playwright/Cypress
  suite, for end-to-end and visual-fidelity verification against the Figma screens at each phase
  gate.
- **Real Gemini API calls against real sample documents** (not mocked/fixture-only) for
  verifying question-extraction and answer-mapping *accuracy* in Phases 3–4 — quota is not a
  constraint for this project, so there's no reason to test the actual value proposition (does
  the model extract/match correctly) against anything but the real model.
- **No CI** — the assignment timeline doesn't justify CI setup; all gates run locally, tracked
  manually in `docs/TRACKER.md`.

**Why:** Matches how the two kinds of risk in this app are actually different: app logic (math,
validation, state) is fully testable and should be automated and repeatable; model output quality
is not something a mock can validate — only the real model against real documents proves the
extraction/mapping actually works, which is the whole point of the assignment's evaluation
criteria.

**Alternatives considered:**
- Fixture/mocked-only testing for extraction/mapping (the initial default proposal) — rejected
  once quota was confirmed to be a non-issue, since real-document testing is strictly more
  informative and the assignment is explicitly graded on real-world extraction/mapping accuracy.
- A maintained Playwright suite — adds setup/maintenance overhead without a CI pipeline to run it
  automatically; claude-in-chrome achieves the same "verify in a real browser" requirement
  interactively at each gate without that overhead.

**Trade-offs / risks:**
- Real-API-based verification isn't a repeatable automated regression suite — a future code
  change could silently regress extraction quality without a failing test catching it. Mitigated
  by re-running the same real sample documents manually whenever Phase 3/4 logic changes, and
  logging results in the tracker each time.
- Without CI, "tests green" is only as reliable as remembering to run them locally before
  advancing a phase — the tracker's phase-gate checklist is the enforcement mechanism instead of
  automated pipeline enforcement.

## [2026-08-26] Upload architecture correction: direct client-to-Vercel-Blob upload, not a multipart POST to our own API route
**Decision:** Files are uploaded directly from the browser to Vercel Blob storage (bypassing our
own Next.js Function entirely for the file bytes), using a short-lived client-upload token issued
by a tiny API route. The processing route then receives only the resulting Blob URL(s) and fetches
the file bytes server-side before forwarding them to Gemini. This replaces the original PRD §4
design of posting both files as `multipart/form-data` straight to an API route.

**Why:** Discovered during pre-Phase-0 research (confirmed independently by two research passes
citing Vercel's own docs): Vercel Functions enforce a **hard 4.5MB request/response body limit**,
infrastructure-level and not configurable. Two files up to 10MB each — the limit already shown in
the Figma design's own "Max 10MB" caption — would blow this limit immediately (`413
FUNCTION_PAYLOAD_TOO_LARGE`) under the originally-scoped design. This is caught now, before any
upload code is written, specifically so the PRD doesn't go stale against a design that can't
actually run on the deploy target.

**Alternatives considered:**
- Lower the advertised per-file limit to fit under 4.5MB (e.g. ~4MB) and keep the naive
  POST-to-API-route design — rejected: it silently breaks fidelity to the Figma design's explicit
  "Max 10MB" copy, and more importantly risks pushing teachers to over-compress scans, directly
  hurting handwriting-OCR accuracy, which is the app's core value proposition.
- Client-side file compression/downscaling before a normal POST — rejected for the same OCR-risk
  reason: compression artifacts on handwritten answer sheets are exactly the failure mode that
  would tank extraction/mapping accuracy, the assignment's top evaluation criterion.
- Chunked upload to our own API route — rejected as unnecessary complexity; Vercel Blob's
  client-upload flow solves the exact same problem natively on the same platform we're already
  deploying to, with less code to write and maintain.

**Trade-offs / risks:**
- Adds a new external dependency (`@vercel/blob`) and a new required env var
  (`BLOB_READ_WRITE_TOKEN`), meaning a Vercel account/Blob store must exist **starting at Phase 1
  local development**, not just at Phase 9 deployment — earlier than originally planned.
  Vercel Blob's free tier is generous enough for assignment-scale use.
- Slightly more moving parts than a single POST (token-issue route → client upload → separate
  processing route that re-fetches the blob) — judged worth it to preserve both the Figma-spec
  file-size limit and answer-extraction quality.
- Uploaded blobs are transient scratch data for a single grading session with no auth; should be
  set to a short TTL/cleaned up (or left as acceptable throwaway cost) rather than accumulating
  indefinitely, since there's no user account to scope cleanup to.

## [2026-08-26] Icons: lucide-react instead of downloading Figma's exported icon assets
**Decision:** Shared shell (sidebar/top bar) and future UI use `lucide-react` icon components
chosen to visually match each Figma icon's intent (e.g. `LayoutGrid` for Home, `ClipboardList`
for Exams), rather than downloading and committing the actual SVG assets Figma's design-context
tool exports.

**Why:** Figma's exported asset URLs are short-lived (expire ~7 days) and are meant to be
downloaded-and-committed if used long-term; `lucide-react` is already a common, MIT-licensed,
tree-shakeable icon set with a close visual match to the outline-style icons used throughout this
design, and using it avoids managing a folder of one-off SVG files for icons that carry no unique
brand meaning (arrows, bells, settings gears, etc.).

**Alternatives considered:**
- Download and commit each Figma icon asset — more faithful pixel-for-pixel, but adds asset
  management overhead (dozens of one-off SVGs) for icons that are otherwise generic UI glyphs;
  reserved for anything with actual brand-specific artwork (e.g. the mascot illustration on the
  upload screen), not generic outline icons.
- Hand-drawing inline SVGs — explicitly against the design-to-code skill's guidance (never
  hand-write icon paths without the real vector data).

**Trade-offs / risks:** A handful of icons are an approximate match rather than pixel-identical
to the Figma source glyphs — acceptable for generic navigation/utility icons; if a specific icon
turns out to look visibly wrong next to the Figma reference during a phase's visual verification,
swap that one icon for a downloaded-and-committed Figma asset instead of forcing a lucide
substitute.
