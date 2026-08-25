# Research Notes

Condensed findings from the 10 parallel research/drafting agents run before Phase 0 build start.
Reference material for the phases named — code here is a draft to adapt during that phase's
actual implementation, not pre-written source. Anything marked **[UNVERIFIED]** must be
independently confirmed against the real installed package/docs before being relied on in code —
research agents can drift or misreport fast-moving APIs.

---

## 1. Next.js scaffold (Phase 0)

`create-next-app` **refuses to run in-place** here — `CLAUDE.md` and `initial.md` aren't on its
safe-ignore list (`docs/`, `.git*`, lockfiles, `LICENSE` are fine; those two aren't) and it also
tries to generate its own `CLAUDE.md`/`AGENTS.md`, which would clobber ours.

**Workaround:** scaffold into a sibling temp dir, then move over only the generated app files:
```
npx create-next-app@latest ../vedaai-scaffold-tmp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git
```
Move in: `src/`, `public/`, `package.json`, `next.config.ts`, `tsconfig.json`, `next-env.d.ts`,
`eslint.config.mjs`, `postcss.config.mjs` (and merge `.gitignore` rather than overwrite — ours
already exists). Discard the template's own `CLAUDE.md`/`AGENTS.md`/`README.md`.

**Recommended folder structure:**
```
src/
  app/
    page.tsx                 # upload screen
    mapping/page.tsx         # question-answer mapping screen
    api/
      extract-questions/route.ts
      extract-and-map-answers/route.ts
      blob-upload-token/route.ts   # NEW — see §7
  components/
    shell/                   # sidebar, topbar (shared)
    upload/                  # dropzones, file chips
    mapping/                 # question list, answer viewer, overlays
  lib/
    gemini/                  # client wrapper (Phase 2)
    schemas/                 # Zod schemas for Question/AnswerRegion/Grading
    validation/              # file type/size checks
  types/
```

Route handlers: `export const runtime = 'nodejs'` (Gemini SDK needs Node, not Edge), parse with
`await request.formData()`.

---

## 2. Gemini SDK usage — extraction, PDF input, bounding boxes **[UNVERIFIED]**

The research agent found docs describing a newer **Interactions API**
(`client.interactions.create()`, model `gemini-3.7-flash`) alongside the older, still-documented
`ai.models.generateContent()` (model `gemini-2.5-flash`). **Do not commit to either surface
without checking the actual installed `@google/genai` package's TypeScript types/exports first**
— this is a fast-moving API and the report itself flagged the model name/API surface as unverified
against a real install. Verification is a Phase 2 task, not done yet.

Both surfaces reportedly support: structured JSON output via a response schema, native inline or
Files-API PDF input (50MB/1000 pages per doc; small files inline as base64, larger/reused ones via
the Files API), and bounding-box grounding in the normalized 0–1000 `[ymin,xmin,ymax,xmax]`
format — combinable with structured output in a single call. Box origin is top-left; divide by
1000 and multiply by real pixel dimensions to convert.

**Phase 2 action item:** run `npm ls @google/genai` / inspect its type defs directly, and re-derive
the exact call shape from the installed version before writing the real wrapper.

---

## 3. Vitest + React Testing Library setup (Phase 0)

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e/**'],
  },
})
```
`vitest.setup.ts`: `import '@testing-library/jest-dom/vitest'`

Deps: `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom`, `@testing-library/react`,
`@testing-library/jest-dom`, `@testing-library/user-event`.
Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

**Gotchas:**
- Server Components (default, especially `async` ones) can't render under RTL — only test Client
  Components + extracted pure logic/hooks; leave Server Component rendering to claude-in-chrome.
- `next/navigation` hooks throw outside a real request context — mock per-test.
- `next/image` misbehaves under jsdom — mock to a plain `<img>` passthrough.
- `next/font` (webpack loader) errors under Vitest — keep font imports isolated to root layout.
- Route handlers using Web `Request`/`Response` may need `// @vitest-environment node` per file.

---

## 4. Zod patterns for validating LLM JSON (Phase 2)

- Single schema as source of truth; derive types with `z.infer`, never a parallel hand-written
  interface.
- Always `safeParse`, never `parse` — LLM output is untrusted; branch on `result.success` for a
  typed success/error path instead of try/catch.
- Defensive schema design: `.nullable()`/`.default()` for fields the model may omit,
  `z.coerce.number()` for fields it might stringify, `.catch(fallback)` on individual
  optional/cosmetic fields (e.g. confidence) so one bad field doesn't reject the whole object,
  `z.array(Item).catch([])` for list fields.

```ts
const AnswerRegionSchema = z.object({
  pageIndex: z.coerce.number().int().min(0),
  boundingBox: z.object({ yMin: z.number(), xMin: z.number(), yMax: z.number(), xMax: z.number() }),
  transcribedText: z.string().default(""),
  detectedLabel: z.string().nullable().default(null),
  matchedQuestionId: z.string().nullable().default(null),
  matchConfidence: z.number().min(0).max(1).catch(0),
});
```
Retry/re-prompt-on-validation-failure is an orchestration concern for the Phase 2 wrapper, not a
Zod concern.

---

## 5. Tailwind theme from Figma tokens (Phase 0)

Drafted assuming Tailwind v3 (`tailwind.config.ts`) — **verify which major version
`create-next-app` actually scaffolds** (v4 uses CSS `@theme` blocks in `globals.css` instead of
this file entirely; port the same values there if so).

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { primary: "#303030", secondary: "#5E5E5E", inverse: "#FFFFFF" },
        brand: { orange: "#FF5623" },
        surface: {
          white: "#FFFFFF", "dark-grey": "#2B2B2B", "off-white": "#F6F6F6",
          "off-white-20": "#F0F0F0", disabled: "#A9A9A9",
        },
        success: { DEFAULT: "#34AC15", tint: "rgba(69, 181, 41, 0.1)" },
        warning: { DEFAULT: "#E3600F", tint: "rgba(255, 153, 0, 0.1)" },
        danger: { DEFAULT: "#C0350A", tint: "#FFE9E2" },
        highlight: { border: "#3DD218", fill: "rgba(94, 255, 53, 0.1)" },
      },
      fontFamily: { sans: ["Bricolage Grotesque", "ui-sans-serif", "system-ui", "sans-serif"] },
      fontWeight: { normal: "400", medium: "500", semibold: "600", bold: "700", extrabold: "800" },
      borderRadius: {
        sm: "8px", md: "12px", lg: "16px", xl: "20px", "2xl": "24px", "3xl": "40px",
        pill: "64px", full: "100px",
      },
      boxShadow: { realistic: "0px 32px 48px rgba(0,0,0,0.2), 0px 16px 48px rgba(0,0,0,0.12)" },
    },
  },
  plugins: [],
};
export default config;
```

---

## 6. Synthetic sample test documents (Phase 3/4 prerequisite)

No scanner, no physical handwriting, no copyrighted exam content available — generate
programmatically:

- **Question paper (clean text) → `pdfkit`.** Stream 12–13 original placeholder questions
  (numbered, with `11(a)`/`11(b)` as separate sub-parts) to a `PDFDocument` using a built-in font
  (no licensing concern). Output `test-fixtures/sample-question-paper.pdf`.
- **Answer sheet (looks handwritten) → `puppeteer` + HTML/CSS + a self-hosted OFL handwriting
  Google Font** (e.g. "Caveat" or "Patrick Hand" — both free for any use, no attribution
  required). Ruled-paper look via CSS `repeating-linear-gradient` (no image asset needed).
  Author original placeholder answers across 3–4 A4-sized page divs, deliberately structured to
  hit: one **unanswered** question, one answer given **out of printed order**, one **unmatched**
  paragraph (no question label / off-topic), and one answer that **spans 2+ pages**. Render with
  `page.pdf({ format: 'A4' })`. Output `test-fixtures/sample-answer-sheet.pdf`.

Both toolchains are Node-only, no network dependency once the font file is fetched once and
self-hosted, and fully original content — safe for a public repo.

---

## 7. Vercel limits → **architecture correction** (Phase 1/2)

**Confirmed independently by two research agents, citing Vercel's own docs:** Vercel Functions
enforce a **hard 4.5MB request/response body limit**, infrastructure-level, not configurable.
Two ≤10MB files posted via `multipart/form-data` to an API route — the design as originally
scoped in PRD §4 — would fail immediately with `413 FUNCTION_PAYLOAD_TOO_LARGE`. This is a real
blocker, not a hallucination; **the original PRD §4/§13 upload design needs correcting** — see the
decision logged in `docs/DECISIONS.md` and the updated PRD/TRACKER sections.

**Duration:** not a concern — Hobby tier gets 300s under Fluid compute (default-on), far more
than a 20–30s Gemini call needs. Still set explicitly for clarity:
```ts
export const runtime = 'nodejs';
export const maxDuration = 60;
```

---

## 8. Question Extraction prompt + schema draft (Phase 3)

Full prompt text and Zod schema drafted — stored here for reference, to be wired into actual code
during Phase 3 (not written into `lib/` yet, to respect the phase gate). Key points: exact
printed order, sub-parts as fully separate entries (with a worked example inline in the prompt),
verbatim original numbering (never renumber), marks captured only if explicitly stated else
`null`, multi-column read in natural reading order, best-effort transcription rather than
omission when uncertain. Schema mirrors the `Question` interface in PRD §6 exactly.
*(Full prompt text preserved in the Phase 3 agent's output — retrieve when Phase 3 starts if not
copied forward into this file by then.)*

---

## 9. Answer Extraction + Mapping prompt + schema draft (Phase 4)

Full prompt text and Zod schema drafted (system prompt + 4-step procedure: segment → extract
per-region fields → match via strict priority order [label → sequential → semantic → unmatched]
→ link multi-page continuations) — stored for reference, wired into code during Phase 4. Notable
details worth preserving when implementing:
- Matching priority is explicitly **ordered with a "stop at first applicable rule"** instruction,
  and confidence bands are specified per rule (label ≥0.9, sequential 0.5–0.8, semantic 0.2–0.5
  and never claimed ≥0.6, unmatched typically ≥0.7 when confident it's genuinely unrelated).
- Explicit instruction: prefer semantic matching over a weak sequential guess whenever the two
  are in tension (handles out-of-order answers correctly).
- Explicit instruction: never force a match onto the nearest question just to avoid returning
  `null` (handles unmatched answers correctly, avoids false attribution).
- Schema includes a `superRefine` cross-check that every `continuesFromRegionId` actually
  references another region's `id` in the same response.
- Caller (not the schema) is responsible for cross-checking `matchedQuestionId` against the real
  injected `Question[].id` set, since Zod alone doesn't have that context at parse time.
*(Full prompt text preserved in the Phase 4 agent's output — retrieve when Phase 4 starts if not
copied forward into this file by then.)*

---

## 10. Mobile Figma frames (Phase 8 prep, optional bonus)

All mobile frames are 393px wide. Sidebar is replaced entirely by a single 56px top app bar (back
arrow + wordmark + bell/sparkle/avatar, no nav list — presumably behind an unshown hamburger).
Upload screens: dropzones/chips stack vertically instead of side-by-side; H1 drops to 24px
(wraps to two lines), captions to 12px. Loading screen is structurally identical to desktop, just
full-width. **Mapping screen replaces the two-panel layout with a segmented pill toggle**
("Questions" | "Answer Sheet") that swaps the full-width content area between the question list
and the answer-sheet viewer — same card list and same green-bbox-overlay/"Q2"-tag highlighting
mechanism as desktop, confirming the highlighting logic itself needs no mobile-specific changes,
only the surrounding layout does. No new color/typography tokens beyond what's already logged.
