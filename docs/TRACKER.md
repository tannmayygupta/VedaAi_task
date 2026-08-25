# Sprint Tracker — AI Assessment Extraction & Answer Mapping

Single source of truth for build progress. Built from `docs/PRD.md`. Update this file **as work
happens**, not just at phase end. See `CLAUDE.md` for the phase-gate rule this tracker enforces:
no phase starts before the previous one is marked **Done** with a signed-off review.

**Legend:** 🔲 Not Started · 🔵 In Progress · 🟡 Testing/Review · 🟢 Done · 🔴 Blocked

---

## Overview

| # | Phase | Status | PRD ref | Started | Done |
|---|---|---|---|---|---|
| 0 | Foundations & Tooling | 🔲 | — | | |
| 1 | Upload + Loading UI | 🔲 | §4, §5 | | |
| 2 | Data Models & Gemini Client | 🔲 | §13 | | |
| 3 | Question Extraction | 🔲 | §6 | | |
| 4 | Answer Extraction + Mapping | 🔲 | §7 | | |
| 5 | Grading & Feedback | 🔲 | §8 | | |
| 6 | Mapping Screen UI (core) | 🔲 | §9 | | |
| 7 | Error & Empty States | 🔲 | §10 | | |
| 8 | Bonus / Polish | 🔲 | §12 | | |
| 9 | Deployment & Submission | 🔲 | §11 | | |

**Open blockers:** Phases 3–4 need real sample test documents (a question paper + a handwritten
answer sheet) to run real-API verification against — see Phase 3 prerequisites. Need these from
the user (or synthetic ones sourced) before Phase 3 can be gated closed.

---

## Phase 0 — Foundations & Tooling

**Status:** 🔲 Not Started
**Goal:** A running Next.js app with the right tooling in place so every later phase can be
built and tested the same way.

**Tasks:**
- [ ] `create-next-app` (TypeScript, App Router, Tailwind, ESLint)
- [ ] `git init`, initial commit, `.gitignore` (incl. `.env.local`)
- [ ] Install Vitest + React Testing Library + jsdom; `npm run test` script
- [ ] Install Zod (or equivalent) for runtime schema validation of Gemini responses
- [ ] Tailwind theme extended with the design tokens already logged (colors, font family
      Bricolage Grotesque, radii) so later phases use tokens, not literals
- [ ] Base app shell: sidebar + top bar component matching the Figma header/sidebar (shared
      across all screens)
- [ ] `.env.local.example` documenting `GEMINI_API_KEY`
- [ ] `README.md` stub (setup instructions — filled in properly at Phase 9)

**Tests:**
- [ ] Smoke test: root layout renders without crashing (Vitest + RTL)
- [ ] Lint + typecheck pass clean

**Manual/visual verification (claude-in-chrome):**
- [ ] Start dev server, load the app, confirm the shared shell (sidebar/topbar) visually matches
      the Figma header/sidebar spacing, colors, and font

**Definition of Done:**
- `npm run dev` runs cleanly, `npm run test` runs cleanly (even if only smoke tests exist),
  `npm run lint`/`tsc --noEmit` clean, shared shell visually matches Figma.

**Test results log:** _(fill in when run)_

**Decisions made this phase:** _(link entries added to DECISIONS.md, if any beyond what's already
logged)_

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 1 — Upload + Loading UI

**Status:** 🔲 Not Started
**Goal:** Teacher can select/drop both files, see validation errors, see the button enable, and
see the loading screen — no AI calls wired yet (stub the "extraction" trigger with a fake delay).

**Tasks:**
- [ ] Empty-state dropzones (question paper / answer sheet) per Figma frame `1:8773`
- [ ] Client-side validation: file type (PDF/JPG/PNG/WEBP), 10MB max, multi-image support per
      slot
- [ ] Filled-state file chips (filename, size, page count, remove ✕) per Figma frame `1:8826`
- [ ] "Start Mapping" button disabled/enabled logic
- [ ] Loading screen per Figma frame `1:9146` (sparkle animation, gradient "Extracting…" text)
- [ ] Route/page structure: `/` (upload) → `/mapping` (or equivalent) once processing "completes"

**Tests (Vitest + RTL):**
- [ ] Validation util: rejects wrong type, rejects >10MB, accepts valid PDF/image(s)
- [ ] Dropzone → chip state transition on valid file select
- [ ] Remove button reverts chip to empty dropzone
- [ ] "Start Mapping" disabled until both slots filled; enabled once both present
- [ ] Invalid file shows inline error message, does not populate the chip

**Manual/visual verification (claude-in-chrome):**
- [ ] Empty state matches Figma `1:8773` (colors, spacing, dashed border, disabled button opacity)
- [ ] Filled state matches Figma `1:8826` (file chip layout, enabled button + shadow)
- [ ] Loading state matches Figma `1:9146`
- [ ] Try an oversized file and a wrong-type file live in the browser, confirm error UX is clear

**Definition of Done:** All tests above green; all three screens visually verified against Figma;
invalid-file paths behave correctly in a live browser check, not just unit tests.

**Test results log:** _(fill in when run)_

**Decisions made this phase:** _(fill in)_

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 2 — Data Models & Gemini Client Wrapper

**Status:** 🔲 Not Started
**Goal:** All the TypeScript types/schemas from `PRD.md` exist and are validated at runtime; a
Gemini client wrapper exists that can send files + a schema and get back parsed, validated JSON —
proven against a trivial real call before building real prompts on top of it.

**Tasks:**
- [ ] `Question`, `AnswerRegion`, `Grading` TypeScript interfaces (PRD §6–§8) + matching Zod
      schemas for runtime validation of model output
- [ ] Gemini client module: takes file(s) + prompt + response schema, returns typed/validated
      result or a typed error
- [ ] Next.js API route(s) skeleton for the pipeline (e.g. `/api/extract-questions`,
      `/api/extract-and-map-answers`) — request/response shapes only, real prompts come in
      Phase 3/4
- [ ] Centralized error types (API failure, quota, malformed response, unreadable file) so
      Phase 7's error UI has something consistent to render

**Tests (Vitest):**
- [ ] Zod schemas: valid sample JSON parses into the typed shape; malformed/missing-field JSON
      is rejected with a clear error
- [ ] Gemini client wrapper: given a mocked SDK response, returns the parsed/validated object;
      given a mocked SDK error, returns the typed error (no unhandled throw)

**Manual/real-API verification:**
- [ ] One real Gemini call (trivial prompt, e.g. "extract the title of this PDF") through the
      wrapper, confirmed to return correctly — proves auth/config/plumbing before building real
      extraction logic on top

**Definition of Done:** Schemas validate correctly in both directions (good/bad input); wrapper
handles both success and failure without crashing; one real end-to-end call through the actual
Gemini API succeeds.

**Test results log:** _(fill in when run)_

**Decisions made this phase:** _(fill in — e.g. exact Gemini SDK/response-schema mechanism used)_

**Review sign-off:** [ ] User approved — date: ____

---

## Phase 3 — Question Extraction

**Status:** 🔲 Not Started
**Goal:** Given a real question paper, get back an accurate, ordered `Question[]` per PRD §6.

**Prerequisite:** Need 1–2 real sample question papers (PDF or images) to test against —
**blocked on the user providing these, or me sourcing/generating reasonable ones** if none are
provided. Ideally at least one paper with labelled sub-parts (e.g. `11(a)`/`11(b)`) to exercise
that rule specifically.

**Tasks:**
- [ ] Prompt design for question extraction (order preservation, sub-part separation, verbatim
      numbering, optional marks capture)
- [ ] Wire prompt + schema through the Phase 2 Gemini wrapper
- [ ] Render extracted questions in a bare-bones list (no styling polish yet — that's Phase 6) to
      inspect output during development

**Tests (Vitest):**
- [ ] Given a saved real Gemini response fixture (captured from a real run), parsing produces
      correctly ordered `Question[]` with sub-parts as separate entries
- [ ] Numbering/display-label formatting logic (e.g. `"11"` + `"a"` → `"11 (a)"`) unit tested in
      isolation

**Manual/real-API verification (real documents, real API — no mocks):**
- [ ] Run against sample question paper #1, manually verify every question was extracted, in
      order, with correct numbering — log the result (pass/fail + notes) below
- [ ] Run against sample question paper #2 (with sub-parts), manually verify sub-part separation
      specifically
- [ ] Try a paper with non-obvious layout (multi-column, or numbering with gaps) if available

**Definition of Done:** Unit tests green; at least 2 real documents verified with 100% of
questions correctly extracted, ordered, and numbered (or documented gaps/limitations if not).

**Test results log:**
| Sample doc | Questions expected | Extracted correctly | Notes |
|---|---|---|---|
| | | | |

**Decisions made this phase:** _(fill in — prompt strategy, any parsing edge cases discovered)_

**Review sign-off:** [ ] User approved — date: ____

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
