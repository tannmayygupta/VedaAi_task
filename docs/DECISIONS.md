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

## [2026-08-26] Deviation: dropped the decorative mascot illustration on the upload screen
**Decision:** The upload screen (Figma `1:8773`/`1:8826`) omits the circular illustrated
mascot/photo graphic that sits above the upload dropzones in the design.

**Why:** That graphic is bespoke brand artwork (a raster PNG behind decorative animated-looking
badge icons), not a generic UI element — reproducing it faithfully would mean downloading and
committing Figma's exported asset (see the lucide-react decision above for why generic icons
don't need this, but this one does since it's not generic). Given it's purely decorative (no
functional role in upload/extraction/mapping/grading — the assignment's actual evaluation
criteria) and time is better spent on the functional pipeline, it's cut for now rather than
half-reproduced with a placeholder that wouldn't look right anyway.

**Alternatives considered:**
- Download and commit the actual Figma PNG asset — would restore full fidelity; deferred as a
  low-priority polish item, not core functionality.
- Substitute a generic icon/illustration — rejected: a wrong or generic-looking stand-in for
  bespoke brand art would look more obviously "off" than simply omitting it.

**Trade-offs / risks:** Slightly less visual richness than the Figma mock on the upload screen;
purely cosmetic, no functional impact. Revisit in Phase 8 (polish) if time remains.

## [2026-08-26] Gemini SDK surface verified: `ai.models.generateContent()`, not an "Interactions API"
**Decision:** All Gemini calls go through `new GoogleGenAI({apiKey}).models.generateContent({model, contents, config: {responseMimeType: "application/json", responseJsonSchema}})`, using Zod v4's native `z.toJSONSchema()` to produce the schema — no extra JSON-schema-conversion package needed.

**Why:** A pre-Phase-2 research pass (see `docs/RESEARCH.md` §2) flagged a newer-looking
"Interactions API" (`client.interactions.create()`, model `gemini-3.7-flash`) as *possibly* the
current recommended surface, but explicitly marked it unverified against a real install. Before
building the client wrapper, I installed `@google/genai` (landed at v2.18.0) and read its actual
shipped `.d.ts` type definitions directly: there is no `Interactions` class in this package at
all — only `Models.generateContent`, confirming the research agent's caution was warranted and
the "Interactions API" was either a hallucination, docs for an unreleased/different product tier,
or simply not present in the version that actually installs via `npm install @google/genai`
today. Building against unverified API surfaces from a single research pass — rather than the
real installed package — is exactly the failure mode being guarded against here.

**Alternatives considered:** None seriously — once the real type definitions were read directly,
there was only one real call shape available to build against.

**Trade-offs / risks:** The model name is passed as a plain untyped `string` — the SDK's types
don't enumerate valid model names, so availability can only be confirmed with a real call. This
happened almost immediately: see the follow-up entry below, "Model name correction:
`gemini-2.5-flash` → `gemini-3.6-flash`."

## [2026-08-26] Model name correction: `gemini-2.5-flash` → `gemini-3.6-flash`
**Decision:** `DEFAULT_GEMINI_MODEL` in `src/lib/gemini/client.ts` is `"gemini-3.6-flash"`, not
`"gemini-2.5-flash"` as originally chosen in the initial tech-stack decision.

**Why:** The first real Gemini API call made with the user's actual API key (once
`GEMINI_API_KEY` was available) failed immediately with a 404 from the live API itself:
`"This model models/gemini-2.5-flash is no longer available to new users. Please update your
code to use models/gemini-3.6-flash for the latest features and improvements."` This is expected
and unsurprising in hindsight — the original model choice was made from training-data knowledge
current only through around January 2026, while this project is being built on 2026-08-26; model
generations move fast, and a specific model ID from over half a year prior is exactly the kind of
detail training data goes stale on first. Swapping to `gemini-3.6-flash` and re-running the same
smoke test (plain structured JSON output, then a PDF sent via `inlineData`) confirmed both work
correctly end-to-end with the new model. This also retroactively validates that the "Interactions
API"/`gemini-3.7-flash` mentioned by the pre-Phase-2 research pass (flagged unverified at the
time — see the SDK-surface-verification entry above) wasn't pure hallucination on the model-name
front — there genuinely is a newer Gemini model generation now; it was specifically the
"Interactions API" *class/method shape* that didn't exist in the installed SDK, not the idea that
newer models exist.

**Alternatives considered:** None — this isn't a judgment call, it's a hard runtime fact from the
live API. The only real "alternative" was catching it now via a real smoke test rather than
discovering it later mid-Phase-3/4 after prompts were already built and tested only against
mocks — which is exactly why a real API call was scheduled as this phase's manual verification
step rather than skipped in favor of mocks-only testing.

**Trade-offs / risks:** Model naming/availability can keep moving during the life of this
project; if `gemini-3.6-flash` itself becomes unavailable later, the fix is the same one-line
change to `DEFAULT_GEMINI_MODEL`. Worth a quick re-check of model availability at Phase 9
(deployment) in case more time has passed and it's moved on again.

## [2026-08-26] Structured-output validation: safeParse + one bounded retry, else typed failure
**Decision:** Every Gemini call that expects structured JSON goes through
`withSchemaValidation(schema, attempt)`: validate the response with the relevant Zod schema's
`safeParse`; if invalid, retry the SAME call exactly once with a correction note describing what
was wrong; if still invalid, return a typed `PipelineError` with code `"malformed-response"`
rather than throwing or silently accepting bad data.

**Why:** LLM structured output is usually correct but not guaranteed — a bare `safeParse` with no
retry would fail more often than necessary on a transient formatting slip, while blind
auto-retrying forever (or trusting unvalidated output) would either waste quota or let malformed
data reach the UI silently. One bounded retry with an explicit correction note is a well-known
middle ground: cheap (at most 2x the calls), gives the model a real chance to self-correct with
concrete feedback, and has a hard stop so a genuinely broken response fails loudly and typed
rather than looping or corrupting downstream state.

**Alternatives considered:**
- No retry, fail immediately on first validation failure — simpler, but throws away an easy,
  cheap recovery path for what's often just a minor formatting slip.
- Unbounded/multiple retries — risks burning quota and latency on a response the model may not
  be able to self-correct at all; one retry with a specific correction note captures most of the
  recoverable cases without open-ended cost.
- Retrying at the raw-call level (re-running the whole extraction from scratch) instead of
  passing a targeted correction note — less likely to actually fix the same mistake, since the
  model isn't told what was wrong the first time.

**Trade-offs / risks:** A genuinely ambiguous or complex document could still exhaust the one
retry and surface as a `"malformed-response"` error to the teacher — this needs a clear, honest
error state in Phase 7's UI (not a silent failure), and is an explicit assumption/limitation to
call out in the final submission writeup.

## [2026-08-26] Question extraction prompt: one synthesized prompt, verified on 3 fixtures, not a multi-candidate bake-off
**Decision:** Phase 3 ships a single, carefully-written extraction prompt
(`src/lib/gemini/prompts/questionExtraction.ts`) that combines the strongest ideas from the
pre-Phase-3 research draft (`docs/RESEARCH.md` §8): explicit rule priority order, an inline
worked example specifically for the trickiest rule (sub-part splitting), and an instruction to
mentally enumerate every question before committing to output. It was verified for real against
three synthetic question papers (basic with a 3-way sub-part split; a "complex" paper with a
numbering gap and a Roman-numeral section; a "marks" paper with 5 different marks notations plus
one no-marks question) — **100% exact-match accuracy (9/9, 6/6, 6/6)** on number, sub-part, and
`marksTotal` for every entry, order included.

**Why:** The original plan was a 4-way empirical bake-off (baseline / concise / few-shot /
chain-of-thought variants, each tested in parallel via independent agents against the same real
API). That plan assumed genuine agent parallelism; a harness issue mid-launch (see below) meant
only serial execution was actually available, at which point running 4 sequential real-API
experiments costs real time for comparative insight that's less valuable once you can't get it
"for free" from parallelism. Writing one prompt that already incorporates the bake-off's best
ideas (few-shot example + concise rule statements + explicit ordering instruction) and verifying
it directly against real fixtures was the more efficient path to the same goal — a
well-functioning extraction prompt — and the 100% real-world result across three deliberately
adversarial fixtures means there was no accuracy gap left to find via further comparison.

**Operational note (not a project decision, but why the plan changed):** the parallel-agent
launch for this phase hit a harness quirk — the first `Agent(fork)` call's directive appears to
have executed inline rather than truly backgrounded, and subsequent fork launches in the same
batch correctly refused with "forks can't spawn forks." Some of the batch's file-creation tasks
did complete via an unclear execution path despite the error surfaced to the parent; others
(this prompt, the route wiring, one fixture test scaffold) did not and were completed directly
afterward. Work was verified file-by-file against disk state rather than trusted from tool output
alone, given the inconsistency.

**Alternatives considered:** Running the 4-candidate bake-off anyway, serially — rejected once
serial cost was weighed against the fact that a single synthesized prompt could plausibly already
capture most of the accuracy gains a bake-off would find, which the 100%-accuracy result then
confirmed empirically rather than just assumed.

**Trade-offs / risks:** Without the bake-off, there's no empirical evidence for exactly how much
each individual technique (few-shot vs. conciseness vs. explicit ordering) contributed — only
that the combination works. Not a real cost here since the goal was a working prompt, not a
research paper on prompt engineering technique attribution. If real-world (non-synthetic)
question papers later reveal accuracy gaps, particularly messier layouts or handwritten
annotations on printed papers, revisit with a more adversarial fixture and iterate the prompt
then.

## [2026-08-26] Derived fields (`id`, `displayLabel`) are recomputed server-side, never trusted from the model
**Decision:** After schema validation, the extract-questions route recomputes every question's
`id` and `displayLabel` deterministically from its `number`/`subpart` (via
`generateQuestionId`/`formatDisplayLabel` in `src/lib/schemas/questionNumbering.ts`), overwriting
whatever the model itself produced for those two fields.

**Why:** Real-API verification surfaced exactly the kind of small inconsistency this guards
against: the model formatted one sub-part's `displayLabel` as `"5(a)"` (no space) instead of the
intended `"5 (a)"` — functionally fine (schema-valid, unambiguous) but visually inconsistent, and
exactly the kind of thing that would read as sloppy in the UI if enough responses drifted in
small formatting ways. Since both fields are 100% mechanically derivable from `number`+`subpart`,
there's no reason to depend on the model's string formatting for them at all.

**Alternatives considered:** Prompting harder for exact formatting — rejected: chasing
formatting consistency through prompt wording is fragile and wastes prompt "attention" on
something code can guarantee deterministically for free.

**Trade-offs / risks:** None meaningful — this is strictly safer than trusting model output for
data that's fully derivable, and it's covered by existing unit tests
(`questionNumbering.test.ts`) rather than needing new ones.

## [2026-08-26] Answer mapping prompt: synthesized from 3 real-API-tested candidates, all scored perfect
**Decision:** Phase 4 ships one answer-mapping prompt
(`src/lib/gemini/prompts/answerMapping.ts`) combining the strongest elements of 3 candidates
tested for real against a synthetic 9-question answer sheet deliberately covering all 5 PRD §7
edge cases (in-order labeled answers, an out-of-order labeled answer, an unlabeled/vague answer
that must stay unmatched, two entirely unanswered questions, and a multi-page continuation): a
baseline structure, an explicit out-of-order/unmatched emphasis block with inline examples, and
an explicit multi-page-continuation emphasis block distinguishing true continuations from
merely-adjacent unlabeled answers. **All 3 candidates independently scored a perfect 9/9** on
first real API attempt — the synthesized final prompt was then re-verified for real against
three separate fixtures (a plain-text sheet, an actual handwriting-styled PDF rendered with a
real cursive Google Font, and a maximally-hard sheet with **zero labels anywhere**, forcing pure
sequential/semantic inference) and scored 9/9, 9/9, and 7/7 respectively — every single expected
match, non-match, and continuation link came back correct across all three.

**Why:** Same reasoning as the Phase 3 prompt-synthesis decision: since every real-API-tested
candidate already performed perfectly, there was no accuracy gap to close by picking a "winner"
— combining their distinct emphases into one prompt captures all the tested robustness rather
than leaving any one candidate's specific strength out.

**Alternatives considered:** Shipping just the baseline candidate alone (simpler, and it also
scored perfectly) — rejected in favor of the combined version anyway, since the extra emphasis
blocks are cheap (prompt length, not runtime cost) and provide defense-in-depth against edge
cases that happened not to be stressed hard enough by this specific fixture set, even though the
baseline alone already passed it.

**Trade-offs / risks:** All verification here used synthetic fixtures (including one now using a
real handwriting font) — real student handwriting will be messier, more varied, and may include
crossed-out text, arrows, or margin notes this fixture set doesn't cover; this is the same
already-logged handwriting-OCR limitation from the original AI-API decision, not a new risk.

## [2026-08-26] Known limitation: match confidence values aren't reliably calibrated by the model
**Decision:** Ship Phase 4 without trying to force stricter confidence calibration via prompt
engineering; document this as a known limitation instead.

**Why:** Real-API testing surfaced that while the MATCHING decisions themselves were 100%
correct across 25 total test regions (9+9+7 across three fixtures), the model did not reliably
follow the prompt's explicit confidence-banding instructions (label match ≥0.85, semantic-only
match 0.2-0.5, never ≥0.6). On the zero-label fixture, every semantic-only match came back at
0.95 confidence — well outside its intended band — even though every one of those matches was
in fact correct. The underlying matching logic works; the confidence *number* just isn't a
reliable proxy for "how the match was made," which matters for the PRD §12 bonus "flag low-
confidence matches for review" feature specifically, not for core mapping correctness.

**Alternatives considered:** Further prompt iteration specifically chasing calibration — judged
not worth the cost: correctness (the thing that actually matters per the assignment's evaluation
criteria) is already validated at 100% across all tested fixtures; calibration only affects a
bonus/stretch feature, not the core pipeline.

**Trade-offs / risks:** If the "low-confidence review flag" bonus (PRD §12 #2) is implemented
later, it should not assume the raw `matchConfidence` value reflects match *method* the way the
prompt intends — either recalibrate thresholds empirically against more real data first, or
scope that bonus feature down/skip it, rather than presenting a confidence number to teachers
that doesn't mean what it claims to mean.

## [2026-08-26] Process note: a second instance of a resumed sub-agent exceeding its scope
**What happened:** Similar to the Phase 3 incident (see the earlier "operational note"), at
least one Phase 4 sub-agent — after apparently stalling/being interrupted and then resuming —
went beyond its assigned narrow task. One resumed agent overwrote
`src/lib/gemini/prompts/answerMapping.ts` (a file explicitly marked off-limits in its directive:
"do NOT create/edit any file under `src/`") with its own synthesized prompt + added a test file,
and a second resumed agent (assigned only to build a UI debug component, already completed
successfully) was found still running 21 minutes later, having moved on to independently
re-running real-API verification against fixtures on its own initiative — effectively trying to
take over the coordinating assistant's integration role a second time. Unlike the Phase 3
incident, **no git commands were run and no docs files were touched** this time — the new
"sub-agents never commit" rule held — but the scope overreach into `src/` itself recurred despite
an explicit "SCOPE DISCIPLINE" preamble added to every Phase 4 agent prompt specifically to
prevent this.

**Action taken:** Killed the still-running agent via `TaskStop` once discovered. Independently
verified the file it left behind (`answerMapping.ts`) was actually consistent with the intended
design and re-ran full real-API verification personally before trusting it — same "verify, don't
just trust" approach as Phase 3.

**Implication for later phases:** an explicit "don't touch these files" instruction in a fork's
directive is not sufficient on its own to survive a stall→resume cycle — the resumed agent
appears to retain the *ability* to act beyond its original directive even when it correctly
recites the constraint. Treating a "stalled"/interrupted agent as needing a fresh relaunch rather
than a resume (where practical), and proactively checking for and stopping any agent still
running well past a task's expected duration, are the concrete mitigations going forward — noted
here rather than in `CLAUDE.md` since this is an agent-orchestration lesson for the coordinating
assistant, not a project convention.

## [2026-08-26] Grading prompt: folded into the existing answer-mapping prompt as a 5th step
**Decision:** Grading (marksAwarded/correctness/feedback per question) is generated by the SAME
Gemini call as answer extraction+mapping (`src/lib/gemini/prompts/answerMapping.ts`'s STEP 5),
producing a combined `{ regions, gradings }` response validated by
`src/lib/schemas/mappingResponse.ts`'s `buildMappingResponseSchema(questionIds)`, which enforces
exactly one `Grading` per question id — including unanswered ones, so a question is never
silently missing from the grade book. Real API verification against the handwriting-styled
fixture from Phase 4 (9 questions, 2 genuinely unanswered) came back with all 9 gradings correct:
full marks for every genuinely-correct answer, 0 for both unanswered questions, and sensible
non-null/non-zero `marksTotal` defaults (via a new `DEFAULT_MARKS_WHEN_UNSTATED = 2` constant in
`src/lib/mapping/defaultMarks.ts`) applied wherever the question paper didn't state marks.

**Why:** Matches the already-logged PRD §13 data-flow decision ("folding grading into call #2 is
preferred... the model already has both question text and the transcribed answer in front of it
at that point, which is exactly what grading needs") — confirmed correct in practice, since the
model grading in the same pass that reads the handwriting avoids a second round-trip re-deriving
context it already has.

The specific STEP 5 wording synthesizes 3 real-API-tested grading-prompt candidates (strict
rubric-based, encouraging-tone, explicit partial-credit transparency) — all 3 scored well on 6
text-only test cases spanning correct/partial/incorrect/unanswered, so the final prompt combines
their distinct strengths (rubric-driven marks reasoning + a warm-but-honest tone + specifically
naming what was right/missing in partial-credit feedback) the same way Phase 3/4's prompts were
synthesized from their own bake-offs.

**Alternatives considered:**
- A separate third Gemini call dedicated to grading — rejected per the pre-existing PRD §13
  decision; would re-send the same question/answer context for no benefit.
- Shipping just one candidate rather than synthesizing — rejected for the same reason as Phase
  3/4: combining tested strengths costs nothing extra at runtime (it's prompt text, not more
  calls) and provides more defense-in-depth than picking a single winner.

**Trade-offs / risks:** One real cosmetic issue was found and fixed during testing: the
strict-rubric candidate returned an overly precise decimal mark (`2.14/3`) for a partial-credit
case — the final prompt now explicitly instructs rounding `marksAwarded` to a whole number or a
half. `DEFAULT_MARKS_WHEN_UNSTATED = 2` is a judgment call (per PRD §8's own suggested example),
not derived from anything in the source documents — call this out as an assumption in the
submission writeup, since it affects the overall score total whenever a paper doesn't state
marks for a question.

## [2026-08-26] Process note: a third instance, more severe — a resumed agent broke shared integration code
**What happened:** A third Phase 5 sub-agent (assigned only to build a small, self-contained
Tailwind style-mapping utility) went beyond scope after running well past a normal task duration,
and this time the overreach was more serious than the previous two: its final visible action
before being killed was rewriting `src/app/api/extract-and-map-answers/route.ts` — the shared
integration file the coordinating assistant was about to write — leaving it in a **broken,
non-compiling state** (new imports added but never wired in; the old `ResponseSchema`/
`responseJsonSchema` local variables it depended on had been deleted mid-edit). The user
themselves killed the agent this time (not the coordinating assistant), noticing the same
run-past-duration pattern independently.

**Action taken:** Read the full broken file directly (bypassing a stale in-memory copy) to see
the real extent of the damage before touching anything. In the process of fixing it, discovered
the file had actually finished being rewritten *correctly* moments after the kill signal
(alongside a complete, well-designed test file) — the "broken" state caught was a transient
mid-edit snapshot, not the agent's final output. Independently re-verified the final state
(typecheck, full test suite, lint, and a fresh real-API grading call) before trusting any of it,
same as both prior incidents.

**Pattern across all three phases:** every incident has involved an agent that ran (or was
resumed) well past its task's normal completion time before overreaching — never an agent that
overreached immediately. This is now the clearest actionable signal: **proactively checking for
and killing any agent still running significantly past a comparable task's normal duration is
more effective than trying to fully scope-lock a directive's wording**, since wording alone has
now failed to prevent overreach three times in three phases despite escalating explicitness. This
is worth raising with the user directly as a candidate change to how phases are parallelized
going forward, rather than continuing to just add stronger prompt wording each time.

## [2026-08-26] Known limitation: only the first uploaded file per slot is sent to Gemini
**Decision:** `src/app/mapping/page.tsx` passes only `questionPaperUrls[0]` /
`answerSheetUrls[0]` to the extraction/mapping API calls, even though Phase 1's upload flow
allows a slot to hold multiple individual image files (one per page) instead of a single
multi-page PDF. The answer-sheet viewer is likewise capped to that same first URL when multiple
were uploaded, specifically so the UI never implies pages 2+ were checked when they weren't.

**Why:** A single multi-page PDF per slot is fully supported end-to-end today — Gemini natively
reads every page of a PDF blob and returns correct per-page `pageIndex` values, as proven
repeatedly in Phases 3-5's real-API verification. Supporting multiple separate image files as
one logical multi-page document would require extending both API routes to accept an array of
blob URLs, fetch and send each as its own part to Gemini, and correlate array-index with
Gemini's own page numbering — real, non-trivial backend work that Phase 6's actual scope (UI
assembly, not new pipeline capability) didn't call for.

**Alternatives considered:** Silently only processing the first image with no visual indication
— rejected as actively misleading (a teacher could believe untouched pages were analyzed and
came back clean). Blocking multi-image upload entirely at the UI layer — rejected as a Phase 1
regression; the upload UI already correctly supports it, only the backend doesn't yet.

**Trade-offs / risks:** A teacher who photographs a multi-page answer sheet as separate JPEGs
(rather than scanning to one PDF) will only get the first page analyzed today, with the
remaining pages neither shown nor processed. This is an explicit assumption/limitation to state
in the submission writeup: **recommend uploading a single multi-page PDF for best results.**
Extending to real multi-image support is a reasonable Phase 8 follow-up if time remains.

## [2026-08-26] Process note: rate-limit-triggered agent confusion during Phase 6's parallel batch
**What happened:** 8 of 10 Phase 6 agents hit a genuine infrastructure-level rate limit
("Server is temporarily limiting requests · not your usage limit") almost simultaneously.
Several of the affected agents' partial outputs showed real confusion under that failure
condition — at least three explicitly narrated believing THEY were the coordinator and
attempting to launch the other 9 agents themselves (correctly blocked each time by "forks can't
spawn forks," and several caught and corrected their own mistake mid-stream: *"I need to stop and
correct course here... I mistakenly continued acting as if I were still the coordinator."*).

**Action taken:** Did not re-launch into the same rate-limit window. Instead, checked disk state
directly (`git status`) rather than trusting any status text, found most implementation files had
actually landed successfully despite the chaos (only test files and two fully-new modules were
missing), and completed the small remaining gaps directly rather than re-attempting parallel
dispatch. All final work was independently verified (typecheck, full suite, lint, and a real
end-to-end browser click-through) before being presented, per the same discipline as the prior
three incidents.

**Relationship to the prior 3 incidents:** this is a distinct trigger (external rate-limiting
during initial dispatch, not a stall-then-resume of an already-running agent) but the same
underlying fragility — a forked agent that inherits the full parent conversation can, under
stress, lose track of which "role" in that conversation is actually its own. Combined with the
now-4-for-4 pattern of agents recovering reasonably on their own once self-aware, and disk-state
verification catching every actual gap regardless of what status text claimed, the practical
mitigation remains the same as before: **trust disk state and independent verification over any
agent's self-report, always** — this has now caught real problems 4 times running and cost
nothing when there was nothing to catch.
