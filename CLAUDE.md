# Project: AI Assessment Extraction & Answer Mapping

This is an internship interview assignment for VedaAI. The build quality matters, but the
ability to explain every decision (in the submission writeup and in an interview) matters just
as much. See `initial.md` for the full spec.

## Standing rule: decision logging

Whenever a non-trivial decision is made — choice of AI model/API, extraction strategy, answer
mapping/matching algorithm, data model/schema, highlighting/bounding-box mechanism, tech stack
pick, edge-case handling approach (out-of-order answers, unanswered questions, unmatched
answers, multi-page answers), or a deliberate deviation from the Figma design — append an entry
to `docs/DECISIONS.md` **before** moving on to the next step. Do this proactively, without
being asked.

Do NOT log trivial stuff: variable/function naming, formatting, typo fixes, minor styling.
That's noise and dilutes the log's value.

Entry format (append, do not rewrite history):

```md
## [YYYY-MM-DD] <short decision title>
**Decision:** what was chosen
**Why:** the reasoning / constraint that drove it
**Alternatives considered:** other options and why they were rejected
**Trade-offs / risks:** what this costs us or could break
```

At natural milestones (question extraction working, answer extraction working, mapping working,
highlighting working, grading working, deployed) distill the relevant log entries into
`docs/APPROACH.md` in plain, interview-ready language — this doubles as the "brief explanation
of your approach" required in the submission form. Explicitly answer "why not X" where a
meaningful alternative existed.

## Standing rule: build via PRD + phased tracker, docs kept in sync

This project is built against `docs/PRD.md` (full feature/functionality spec) and executed in
phases tracked in `docs/TRACKER.md` (sprint tracker). These four docs are one system and must be
kept in sync as work happens, not just at the end:

- `docs/PRD.md` — what to build. If real implementation deviates from what the PRD specified,
  update the PRD to match reality rather than letting it go stale, and log the deviation as a
  decision.
- `docs/TRACKER.md` — phase status, task checklists, and test results, updated live as work
  happens within a phase (not only when a phase finishes).
- `docs/DECISIONS.md` — every non-trivial decision, per the rule above, logged as it's made.
- `docs/APPROACH.md` — the distilled, interview-ready writeup, updated at each phase's
  completion (each phase in the tracker is a milestone).

**Phase gate:** do not start implementation on a phase other than the next "Not Started" phase in
`docs/TRACKER.md`, and do not move to the next phase until the current one is marked Done, which
requires ALL of:
1. Its automated tests (Vitest + React Testing Library) are green.
2. Any AI-dependent extraction/mapping logic in that phase has been verified against real sample
   documents via the real Gemini API (quota is not a constraint on this project) — logged in the
   phase's test-results table in `docs/TRACKER.md`.
3. Any UI-affecting work in that phase has been visually/functionally verified in a real browser
   via claude-in-chrome against the Figma design.
4. The user has reviewed and signed off on the phase in `docs/TRACKER.md`.

No CI is set up for this project (explicit decision) — the tracker's phase-gate checklist is the
enforcement mechanism instead of an automated pipeline.

## Working notes

- Tech stack: Next.js (App Router, currently v16) + TypeScript + Tailwind CSS, deployed on Vercel. File
  uploads go directly from the browser to Vercel Blob (not through our own API route body) —
  see `docs/DECISIONS.md` "Upload architecture correction."
- AI API: Google Gemini (currently `gemini-3.6-flash`) (via `@google/genai`) for extraction, mapping, and grading.
- Testing: Vitest + React Testing Library for unit/component/logic tests; claude-in-chrome
  (agent-driven) for E2E/visual verification instead of a maintained Playwright/Cypress suite;
  real Gemini API calls for extraction/mapping accuracy testing.
- Full rationale for all of the above is in `docs/DECISIONS.md`.
- Must closely follow the Figma design (see `initial.md`).
- No auth, no DB — in-memory only. Must end up deployed to a live URL with a public GitHub repo.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
