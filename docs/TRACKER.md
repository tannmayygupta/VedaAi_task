# Sprint Tracker — AI Assessment Extraction & Answer Mapping

Single source of truth for build progress. Built from `docs/PRD.md`. Update this file **as work
happens**, not just at phase end. See `CLAUDE.md` for the phase-gate rule this tracker enforces:
no phase starts before the previous one is marked **Done** with a signed-off review.

**Legend:** 🔲 Not Started · 🔵 In Progress · 🟡 Testing/Review · 🟢 Done · 🔴 Blocked

---

## Overview

| # | Phase | Status | PRD ref | Started | Done |
|---|---|---|---|---|---|
| 0 | Foundations & Tooling | 🟡 | — | 2026-08-26 | |
| 1 | Upload + Loading UI | 🟢 | §4, §5 | 2026-08-26 | 2026-08-26 |
| 2 | Data Models & Gemini Client | 🟢 | §13 | 2026-08-26 | 2026-08-26 |
| 3 | Question Extraction | 🟢 | §6 | 2026-08-26 | 2026-08-26 |
| 4 | Answer Extraction + Mapping | 🔲 | §7 | | |
| 5 | Grading & Feedback | 🔲 | §8 | | |
| 6 | Mapping Screen UI (core) | 🔲 | §9 | | |
| 7 | Error & Empty States | 🔲 | §10 | | |
| 8 | Bonus / Polish | 🔲 | §12 | | |
| 9 | Deployment & Submission | 🔲 | §11 | | |

**Open blockers:**
- Phases 3–4 need real sample test documents (a question paper + a handwritten answer sheet) to
  run real-API verification against — see Phase 3 prerequisites. Plan: generate synthetic ones
  (`pdfkit` + `puppeteer`, see `docs/RESEARCH.md` §6) rather than wait on external files.
- **Phase 1 now needs a Vercel Blob store + `BLOB_READ_WRITE_TOKEN`** (architecture correction,
  see `docs/DECISIONS.md` "Upload architecture correction") — this requires a Vercel account
  earlier than originally planned (Phase 1, not just Phase 9 deploy). Needs the user to create a
  Blob store (Vercel dashboard → Storage, or `vercel blob store add`) and share the token, or
  confirm they're fine doing this step themselves when we reach Phase 1.

Pre-Phase-0 research is complete — see `docs/RESEARCH.md` for full findings (Next.js scaffold
workaround, Gemini SDK usage caveats, Vitest/RTL config, Zod patterns, Tailwind theme draft,
synthetic test-doc plan, the Vercel Blob correction, both Gemini prompt/schema drafts, and mobile
Figma frame specs for Phase 8).

---

## Phase 0 — Foundations & Tooling

**Status:** 🔲 Not Started
**Goal:** A running Next.js app with the right tooling in place so every later phase can be
built and tested the same way.

**Tasks:**
- [x] `git init`, initial commit, `.gitignore` (incl. `.env.local`)
- [x] `create-next-app` (TypeScript, App Router, Tailwind, ESLint) — scaffolded to a temp sibling
      dir and merged in, per `docs/RESEARCH.md` §1. Actual versions installed: Next.js 16.3.3,
      React 19.2.8, Tailwind v4 (CSS-first `@theme`, no `tailwind.config.ts`) — corrected in
      CLAUDE.md/PRD/DECISIONS from the originally-assumed "Next.js 14"/Tailwind v3.
- [x] Install Vitest + React Testing Library + jsdom; `npm run test`/`test:watch` scripts
- [x] Install Zod for runtime schema validation of Gemini responses
- [x] Tailwind theme tokens ported into `src/app/globals.css` `@theme inline` block (v4 syntax,
      not the originally-drafted v3 config file) — colors, Bricolage Grotesque font family
      (loaded via `next/font/google` in `layout.tsx`), border-radius scale, "realistic" shadow
- [x] Base app shell: `Sidebar.tsx` + `TopBar.tsx` + `AppShell.tsx` under
      `src/components/shell/`, matching the Figma header/sidebar (icons via `lucide-react` — see
      decision log)
- [x] `.env.local.example` documenting `GEMINI_API_KEY` and `BLOB_READ_WRITE_TOKEN`
- [x] `README.md` stub (setup instructions, scripts, stack summary)

**Tests:**
- [x] Smoke test: `Sidebar`/`TopBar` render without crashing, key text present (Vitest + RTL) —
      `src/components/shell/shell.test.tsx`, 3 tests
- [x] Lint + typecheck pass clean

**Manual/visual verification (claude-in-chrome):**
- [x] Dev server loaded at `localhost:3000`; sidebar/top bar visually compared against Figma
      frame `1:8773` — matched on colors, spacing, nav states, and typography. One deviation
      found and fixed: "AI Teacher's Toolkit" pill was wrapping to two lines (too much horizontal
      padding) — fixed to single-line, re-verified via zoomed screenshot.

**Definition of Done:** ✅ met — `npm run dev`/`test`/`lint`/`typecheck` all clean; shared shell
visually matches Figma after one fix.

**Test results log:**
| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run test` | Pass (1 file, 3 tests) |
| Visual check vs Figma `1:8773` | Pass (after 1 fix: pill text wrapping) |

**Decisions made this phase:** "Icons: lucide-react instead of downloading Figma's exported icon
assets" (see `docs/DECISIONS.md`); Next.js/Tailwind version correction (not a new decision, a
factual fix to the existing tech-stack entry).

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 1 — Upload + Loading UI

**Status:** 🔲 Not Started
**Goal:** Teacher can select/drop both files, see validation errors, see the button enable, and
see the loading screen — no AI calls wired yet (stub the "extraction" trigger with a fake delay).

**Prerequisite:** Vercel Blob store created + `BLOB_READ_WRITE_TOKEN` available locally — **still
outstanding**. All code is written and self-verified with mocks; real end-to-end Blob upload
(actually clicking "Start Mapping" against a live token) is NOT yet verified and remains blocked
on this. Everything else is done.

**Tasks:**
- [x] Empty-state dropzones (question paper / answer sheet) per Figma frame `1:8773` —
      `src/components/upload/Dropzone.tsx`
- [x] Client-side validation: file type (PDF/JPG/PNG/WEBP), 10MB max, multi-image support per
      slot — `src/lib/validation/fileValidation.ts`, `src/lib/validation/pageCount.ts`,
      `src/lib/upload/normalizeSlotFiles.ts`
- [x] Filled-state file chips (filename, size, page count, remove ✕) per Figma frame `1:8826` —
      `src/components/upload/FileChip.tsx`
- [x] "Start Mapping" button disabled/enabled logic — `src/components/upload/StartMappingButton.tsx`
- [x] `/api/blob-upload-token` route + client-side direct-to-Blob upload wiring —
      `src/app/api/blob-upload-token/route.ts`, `src/lib/upload/uploadFileToBlob.ts` (built and
      unit-tested against the real installed `@vercel/blob` v2.8.0 types; NOT yet run against a
      real token/live upload — see prerequisite above)
- [x] Loading screen per Figma frame `1:9146` — `src/components/upload/LoadingScreen.tsx`
- [x] Route/page structure: `/` (upload, `src/app/page.tsx`) → `/mapping` (stub,
      `src/app/mapping/page.tsx`, real mapping UI is Phase 6) — navigation fires after both files
      upload to Blob successfully

Built via 10 parallel agents (one file/utility each, no shared-file conflicts) + a main-thread
integration pass (`UploadSlotCard.tsx`, `format.ts`, `page.tsx`, `mapping/page.tsx`,
`page.test.tsx`) wiring them together.

**Tests (Vitest + RTL):** 56 tests across 15 files, all passing —
- [x] Validation util: rejects wrong type, rejects >10MB, accepts valid PDF/image(s)
- [x] Page-count heuristic: correctly excludes `/Pages` root from `/Page` count; multi-image =
      file count
- [x] Dropzone → chip state transition on valid file select (click-to-browse and drag-drop)
- [x] Remove button reverts chip to empty dropzone
- [x] "Start Mapping" disabled until both slots filled; enabled once both present
- [x] Invalid file shows inline error message, does not populate the chip (drag-drop path, since
      a real OS file picker/`accept` attribute would never offer a mismatched file via
      click-to-browse — confirmed this is the realistic edge case to test)
- [x] Blob upload token route + client upload utility: mocked-success and mocked-failure paths
- [x] Full page integration test: upload both slots → Start Mapping → uploads via (mocked) Blob →
      navigates to `/mapping` with blob URLs in the query string; upload failure shows an error
      and does not navigate

**Manual/visual verification (claude-in-chrome):**
- [x] Empty state matches Figma `1:8773` (colors, spacing, dashed border, disabled button opacity)
- [x] Filled state matches Figma `1:8826` (file chip layout, enabled button + shadow) — verified
      with a real file picked via the browser (page count "1 Page" correctly detected)
- [x] Remove button verified live (reverts to dropzone, correctly re-disables Start Mapping)
- [ ] Loading state (`Uploading…` variant) — not yet seen live end-to-end since that requires a
      real Blob token (see prerequisite); the component itself was visually verified in isolation
      via its own test only
- [ ] Real end-to-end Blob upload with a live token — blocked on prerequisite

One fix applied during visual check: the heading's orange highlight chip was using a derived
tint (`brand-orange/15`) instead of Figma's actual distinct tint color (`rgba(255,147,80,0.15)`)
— corrected to match exactly.

**Definition of Done:** Code complete, 56/56 tests green, lint/typecheck clean, UI verified live
in-browser for every interaction that doesn't require a real Blob token. Real end-to-end Blob
upload verification is **deferred to Phase 9** (pre-deployment smoke test) per user decision on
2026-08-26 rather than blocking further phases on it — everything else about Phase 1 is complete
and verified.

**Test results log:**
| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (1 real issue found and fixed: `react-hooks/set-state-in-effect` in `UploadSlotCard`) |
| `npm run test` | Pass (56/56, 15 files) |
| Visual check vs Figma `1:8773`/`1:8826` | Pass (after 1 fix: heading chip tint color) |
| Live click-through (select/remove files, button enable/disable) | Pass |
| Real Blob upload with live token | **Not yet run** — blocked on prerequisite |

**Decisions made this phase:** "Deviation: dropped the decorative mascot illustration on the
upload screen" (see `docs/DECISIONS.md`).

**Review sign-off:** [x] User approved — date: 2026-08-26 (proceeded to Phase 2; live-Blob-token
check explicitly deferred to Phase 9 rather than addressed now)

---

## Phase 2 — Data Models & Gemini Client Wrapper

**Status:** 🔲 Not Started
**Goal:** All the TypeScript types/schemas from `PRD.md` exist and are validated at runtime; a
Gemini client wrapper exists that can send files + a schema and get back parsed, validated JSON —
proven against a trivial real call before building real prompts on top of it.

**Prerequisite:** `GEMINI_API_KEY` in `.env.local` — ✅ done, key provided 2026-08-26.

**Tasks:**
- [x] **Verified the real `@google/genai` SDK surface myself** by installing it (landed at
      v2.18.0) and reading its shipped `.d.ts` files directly — confirmed `ai.models
      .generateContent()` is the real call shape; the "Interactions API"
      (`client.interactions.create()`, model `gemini-3.7-flash`) a pre-Phase-2 research pass had
      flagged as unverified does not exist in this installed package at all. Also confirmed Zod
      v4's native `z.toJSONSchema()` covers schema conversion with no extra dependency. See
      `docs/DECISIONS.md` "Gemini SDK surface verified."
- [x] `Question`, `AnswerRegion`, `Grading` Zod schemas + derived types (PRD §6–§8) —
      `src/lib/schemas/question.ts`, `answerRegion.ts` (incl. bounding-box + multi-page
      cross-reference validation), `grading.ts` (incl. `summarizeGradings`/`scoreTier` helpers)
- [x] Gemini client module — `src/lib/gemini/client.ts` (`callGeminiJson`, verified SDK call),
      `src/lib/gemini/part.ts` (Part builders), `src/lib/gemini/withSchemaValidation.ts`
      (safeParse + one bounded retry with a correction note, else typed failure — see decision
      log), `src/lib/gemini/fetchBlobFile.ts` (server-side Blob fetch)
- [x] API route skeletons — `src/app/api/extract-questions/route.ts`,
      `src/app/api/extract-and-map-answers/route.ts` (plumbing only: request validation, Blob
      fetch, schema-validated response; real extraction/mapping logic explicitly stubbed with a
      `TODO(Phase 3/4)` marker, matching the tracker's original scope)
- [x] Centralized error types — `src/lib/errors.ts` (`PipelineError`, `normalizeError`,
      `pipelineErrorToResponseBody`)

Built via 10 parallel agents (one file/utility each) — same pattern as Phase 1. Cross-file
interface contracts (exact exported types/signatures) were specified up front so agents could
build against each other's not-yet-existing sibling files; one agent caught itself starting a
duplicate stub of another agent's file and correctly deleted it rather than racing.

**Tests (Vitest):** 61 new tests across 10 new files (117 total project-wide), all passing —
- [x] Zod schemas: valid sample JSON parses into the typed shape; malformed/missing-field JSON
      is rejected with a clear error (incl. the `AnswerRegion` multi-page cross-reference check
      and the `Grading` `marksAwarded <= marksTotal` refinement)
- [x] Gemini client wrapper: given a mocked SDK response, returns the parsed object; missing/
      invalid response text rejects; missing `GEMINI_API_KEY` rejects before attempting a call
- [x] `withSchemaValidation`: first-try success, retry-then-success (with a real correction note
      passed through), both-tries-invalid → typed `malformed-response` error, hard throw → no
      retry attempted
- [x] `fetchBlobFile`: success path, missing content-type fallback, non-OK status rejects
- [x] Both API routes: missing-field validation (400), success path (200 with schema-shaped
      body), upstream fetch failure (500)

**Manual/real-API verification:**
- [x] Real Gemini call, plain structured JSON output (`z.toJSONSchema` + `responseJsonSchema`) —
      succeeded on the first real call, but with an important catch: **`gemini-2.5-flash`
      returned a 404 — deprecated, no longer available to new users.** The live API's own error
      message pointed to `gemini-3.6-flash`; swapped `DEFAULT_GEMINI_MODEL` and re-verified —
      works correctly. See `docs/DECISIONS.md` "Model name correction."
- [x] Real Gemini call with a PDF sent via `inlineData` (base64) — succeeded, model correctly
      described the (blank test) PDF's contents, confirming the file-input mechanism works
      end-to-end, not just plain text prompts.

**Definition of Done:** ✅ met — 117/117 tests green, lint/typecheck clean, real end-to-end Gemini
calls verified for both structured JSON output and file input, using the corrected model name.

**Test results log:**
| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (added an eslint rule tweak: `argsIgnorePattern: "^_"` so intentionally-unused stub params don't warn) |
| `npm run test` | Pass (117/117, 23 files) |
| Real Gemini API call (structured JSON) | Pass (after model-name fix — see decision log) |
| Real Gemini API call (PDF file input) | Pass |

**Decisions made this phase:** "Gemini SDK surface verified: `ai.models.generateContent()`, not
an 'Interactions API'"; "Structured-output validation: safeParse + one bounded retry, else typed
failure"; "Model name correction: `gemini-2.5-flash` → `gemini-3.6-flash`" (all in
`docs/DECISIONS.md`).

**Review sign-off:** [x] User approved — date: 2026-08-26 (provided `GEMINI_API_KEY`, real
end-to-end verification completed same day)

---

## Phase 3 — Question Extraction

**Status:** 🔲 Not Started
**Goal:** Given a real question paper, get back an accurate, ordered `Question[]` per PRD §6.

**Prerequisite:** Real sample question papers — resolved by generating 3 original synthetic
fixtures via `pdfkit` (no external/copyrighted content needed): `question-paper-basic.pdf`
(sub-parts, mixed marks), `question-paper-complex.pdf` (numbering gap + Roman-numeral section),
`question-paper-marks.pdf` (5 marks-notation variants + one no-marks question). Generator
scripts + ground-truth JSON committed under `scripts/fixtures/` and `test-fixtures/`.

**Tasks:**
- [x] Prompt design — `src/lib/gemini/prompts/questionExtraction.ts` (system prompt with rule
      priority order + an inline worked example for sub-part splitting, plus a user-prompt
      builder for `order`/`id` instructions)
- [x] Wired through the Phase 2 Gemini wrapper — `src/app/api/extract-questions/route.ts` now
      calls `callGeminiJson` + `withSchemaValidation` with the real prompt, replacing the Phase 2
      stub; also post-processes `id`/`displayLabel` deterministically (see decision log) rather
      than trusting the model's own formatting of fully-derivable fields
- [x] Bare-bones question list debug view — `src/components/dev/QuestionListDebugView.tsx` +
      `src/app/dev/questions/page.tsx` (paste raw JSON, render it) — visually verified live

**Tests (Vitest):** 8 new tests across 3 new files (140 total project-wide) —
- [x] Fixture-based test: a captured real Gemini response (`test-fixtures/sample-gemini-question-
      response.json`) validates against `QuestionArraySchema`, preserves ascending order, keeps
      a 3-way sub-part split as separate entries, and preserves both null and non-null
      `marksTotal` correctly typed
- [x] Prompt content smoke test (covers every PRD §6 rule keyword)
- [x] Route test rewritten for the real wiring: 200 on a well-formed response, retry-then-succeed
      on a malformed-then-valid response, 502 when malformed on both attempts, 500 on blob-fetch
      failure — `callGeminiJson` mocked, everything else (schema, prompt, `withSchemaValidation`,
      errors) real
- [x] `questionNumbering.ts` (`formatDisplayLabel`, `generateQuestionId`, `assertPrintedOrder`) —
      unit tested in isolation, landed with a different-but-equally-valid design than originally
      sketched (assert-and-throw instead of silent re-sort for order — arguably safer)

**Manual/real-API verification (real documents, real API — no mocks):** ✅ **100% accuracy on
all 3 fixtures.**
- [x] `question-paper-basic.pdf` — 9/9 exact matches (order, number, subpart, marksTotal),
      including the 3-way sub-part split (5a/5b/5c)
- [x] `question-paper-complex.pdf` — 6/6 exact matches, correctly preserved the Roman-numeral
      section (i/ii/iii) AND the numbering gap (7 → 9, no invented "8")
- [x] `question-paper-marks.pdf` — 6/6 exact matches across 5 different marks-notation styles
      plus the one no-marks question correctly returning `null`

One real inconsistency found and fixed: the model's own `displayLabel` string formatting was
occasionally inconsistent (`"5(a)"` vs the intended `"5 (a)"`) — fixed by never trusting the
model for `id`/`displayLabel` at all, recomputing both deterministically server-side.

**Definition of Done:** ✅ exceeded — 3 real documents (not just the minimum 2), 100% extraction
accuracy on all of them, all unit tests green, lint/typecheck clean.

**Test results log:**
| Sample doc | Questions expected | Extracted correctly | Notes |
|---|---|---|---|
| question-paper-basic.pdf | 9 | 9/9 | 3-way sub-part split (5a/5b/5c) correct |
| question-paper-complex.pdf | 6 | 6/6 | Roman numerals + numbering gap (7→9) both correct |
| question-paper-marks.pdf | 6 | 6/6 | 5 marks-notation styles + 1 null-marks correct |

**Decisions made this phase:** "Question extraction prompt: one synthesized prompt, verified on 3
fixtures, not a multi-candidate bake-off" (incl. an operational note on a parallel-agent harness
quirk hit this phase); "Derived fields (`id`, `displayLabel`) are recomputed server-side, never
trusted from the model" (both in `docs/DECISIONS.md`).

**Process note:** one sub-agent this phase significantly overstepped its scope (see
`docs/DECISIONS.md` operational note) — committed the phase's work autonomously instead of
reporting back for review. The coordinating assistant independently re-verified everything
before presenting it (re-ran the full test suite, re-ran a real extraction against
`question-paper-basic.pdf` from scratch and got matching results) rather than trusting the
self-report. A standing rule ("Sub-agents never commit") was added to `CLAUDE.md` afterward.

**Review sign-off:** [x] User approved — date: 2026-08-26 (approved after the process note above
was raised and independently verified)

---

## Phase 4 — Answer Extraction + Mapping

**Status:** 🔲 Not Started
**Goal:** Given a real handwritten answer sheet + the Phase 3 question list, get back accurate
`AnswerRegion[]` per PRD §7, correctly handling every edge case in `initial.md`.

**Prerequisite:** Real sample answer sheet(s) — ideally covering, across one or more samples:
at least one unanswered question, at least one answer out of printed order, at least one answer
with no matching question (or a scratch/extra note), and at least one answer spanning 2+ pages.
**Blocked on the user providing these, or me sourcing/generating reasonable ones.**

**Tasks:**
- [ ] Prompt design for the combined extract+match call (label match → sequential inference →
      semantic match → unmatched, per PRD §7 priority order)
- [ ] Wire through Gemini wrapper with the `AnswerRegion` schema
- [ ] Bounding-box → percentage conversion utility (pure function, testable in isolation)
- [ ] Bare-bones rendering: draw overlay boxes on the answer sheet image using extracted boxes,
      no full UI polish yet (Phase 6 does that)

**Tests (Vitest):**
- [ ] bbox-to-percentage conversion: given known image dimensions + a known normalized box,
      output matches hand-calculated expected percentages
- [ ] Given a saved real response fixture, matching-result parsing correctly distinguishes
      matched/unmatched/multi-page-linked regions

**Manual/real-API verification (real documents, real API):**
- [ ] Run against a real answer sheet with a labelled, in-order, fully answered set — confirm
      every answer maps to the right question
- [ ] Run against a sample exercising **out-of-order answers** — confirm correct mapping despite
      order
- [ ] Run against a sample with an **unanswered question** — confirm it's correctly left
      unmatched (no answer falsely attributed to it)
- [ ] Run against a sample with an **answer with no matching question** — confirm it comes back
      with `matchedQuestionId: null`, not force-matched
- [ ] Run against a sample with a **multi-page answer** — confirm `continuesFromRegionId` links
      the regions correctly
- [ ] Visually confirm (claude-in-chrome, bare-bones overlay render) that boxes actually land on
      the handwriting, not off-target

**Definition of Done:** Unit tests green; all 5 edge cases above verified against real documents
with correct behavior (or explicitly documented limitations where the model falls short);
bounding boxes visually land on the correct handwriting region.

**Test results log:**
| Edge case | Sample doc | Result | Notes |
|---|---|---|---|
| Fully answered, in order | | | |
| Out of order | | | |
| Unanswered question | | | |
| Unmatched answer | | | |
| Multi-page answer | | | |

**Decisions made this phase:** _(fill in — matching prompt strategy details, any deviation from
the priority order originally specified in PRD §7)_

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 5 — Grading & Feedback

**Status:** 🔲 Not Started
**Goal:** Per-question marks/correctness/feedback (folded into the Phase 4 call per the logged
decision) plus overall summary aggregation, per PRD §8.

**Tasks:**
- [ ] Extend the Phase 4 response schema with `Grading` fields per matched region
- [ ] Overall summary aggregation function (total awarded / total possible, unanswered count,
      unmatched count) — pure function
- [ ] Score-pill color-tier logic (green/amber/red/grey-unanswered) — pure function

**Tests (Vitest):**
- [ ] Aggregation function: given a known set of per-question gradings (including some
      unanswered), totals and counts are computed correctly
- [ ] Color-tier function: boundary cases (0, partial, full, unanswered) map to the correct tier

**Manual/real-API verification:**
- [ ] On the same real answer sheet(s) from Phase 4, sanity-check the AI-assigned marks and
      feedback text are reasonable (not nonsensical) for a handful of questions

**Definition of Done:** Aggregation/tier unit tests green; spot-checked grading output is
sensible on real data.

**Test results log:** _(fill in when run)_

**Decisions made this phase:** _(fill in — e.g. default marks-per-question fallback value used)_

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 6 — Mapping Screen UI (core)

**Status:** 🔲 Not Started
**Goal:** The full two-panel mapping screen per Figma `1:8890` — question list, click-to-highlight,
answer sheet viewer with zoom/page nav, unmatched-answers panel — fully wired to real pipeline
output end-to-end.

**Tasks:**
- [ ] Left panel: question card list, score pills, expand/collapse + AI Feedback panel, "Expand
      All", overall summary banner (PRD §8 bonus #1, effectively core per PRD note)
- [ ] Right panel: answer sheet viewer, zoom control, page navigator, highlight overlay
      rendering using the Phase 4 conversion utility
- [ ] Click-question → jump-to-page + highlight interaction (incl. multi-page answers jumping
      through all linked regions)
- [ ] Unmatched-answers panel (PRD §9) — every unmatched region reachable and clickable
- [ ] Unanswered-question state in the right panel ("No answer found for this question")

**Tests (Vitest + RTL):**
- [ ] Clicking a question card updates selection state and computes the correct page/region to
      display (component/unit level, with mocked pipeline data)
- [ ] Unanswered question renders the "no answer" state, not a broken/empty highlight
- [ ] Unmatched panel renders all unmatched regions and each is clickable

**Manual/visual + functional verification (claude-in-chrome), against real pipeline output from
Phase 3/4 real documents:**
- [ ] Visual match against Figma `1:8890` (colors, spacing, card states, badge styles)
- [ ] Click through every question on a real processed answer sheet; confirm every click produces
      the correct highlight or the correct "unanswered" state
- [ ] Click through the unmatched-answers panel; confirm every entry is reachable
- [ ] Test zoom in/out and page navigation don't break highlight alignment

**Definition of Done:** Component tests green; full real-document click-through in a live browser
produces correct highlights/states for every question and every unmatched answer; visual match to
Figma confirmed.

**Test results log:** _(fill in when run)_

**Decisions made this phase:** _(fill in)_

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 7 — Error & Empty States

**Status:** 🔲 Not Started
**Goal:** Every failure mode identified in PRD §10 has a real, non-silent UI state.

**Tasks:**
- [ ] Upload validation errors (already partly done in Phase 1 — confirm coverage)
- [ ] Extraction/API failure → error screen with "Try Again" (files retained)
- [ ] Empty-result state (zero questions detected)
- [ ] Partial-failure handling (treat as full failure, per PRD §10 decision)

**Tests (Vitest + RTL):**
- [ ] Simulated API failure (mocked) renders the error screen, not a crash or infinite loader
- [ ] "Try Again" returns to upload screen with previously selected files still present
- [ ] Simulated empty-questions response renders the explicit empty-state message

**Manual verification (claude-in-chrome):**
- [ ] Force a real failure (e.g. temporarily invalid API key, or an unreadable file) and confirm
      the live UI degrades gracefully

**Definition of Done:** All simulated + one real failure path verified; no infinite spinners, no
blank screens, no unhandled crashes.

**Test results log:** _(fill in when run)_

**Decisions made this phase:** _(fill in)_

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 8 — Bonus / Polish

**Status:** 🔲 Not Started
**Goal:** Implement the highest-value, lowest-effort items from PRD §12, time permitting, in
priority order. **Do not start this phase before Phase 0–7 are all Done.**

**Candidate order (re-confirm with user before starting each):**
- [ ] #2 Confidence flag on low-confidence matches
- [ ] #3 sessionStorage persistence of results
- [ ] #5 Keyboard navigation
- [ ] #6 Export raw extraction as JSON
- [ ] #4 Export graded report (PDF/print view)
- [ ] #7 Manual re-link of mis-mapped answer (only if ample time remains)
- [ ] #8 Mobile-responsive layout (only if ample time remains)

**Tests:** per-feature, defined when each is started (same Vitest/RTL + claude-in-chrome pattern
as prior phases).

**Definition of Done:** Each attempted bonus item individually tested and visually verified
before being marked done; nothing half-implemented is left in the build.

**Test results log:** _(fill in per item attempted)_

**Decisions made this phase:** _(fill in)_

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 9 — Deployment & Submission

**Status:** 🔲 Not Started
**Goal:** Live URL + public GitHub repo + finished submission materials.

**Tasks:**
- [ ] Create/connect GitHub repo, push
- [ ] Deploy to Vercel, configure `GEMINI_API_KEY` env var there
- [ ] Smoke-test the full pipeline on the **live deployed URL**, not just localhost
- [ ] Finalize `README.md` (setup, env vars, how to run locally)
- [ ] Distill `DECISIONS.md` into a finished `docs/APPROACH.md` (submission-ready writeup)
- [ ] Fill out the submission form fields: live URL, repo link, approach summary, AI model used,
      assumptions/limitations (pull directly from `APPROACH.md`)

**Tests / verification:**
- [ ] Full upload → extract → map → grade flow run end-to-end on the live URL with a real
      document, via claude-in-chrome
- [ ] Confirm no server-side secrets are exposed client-side (check network tab / bundle)

**Definition of Done:** Live URL works end-to-end for a fresh visitor with no setup; repo is
public; `APPROACH.md` is submission-ready; submission form fields drafted.

**Test results log:** _(fill in when run)_

**Decisions made this phase:** _(fill in)_

**Review sign-off:** [ ] User approved — date: ____
