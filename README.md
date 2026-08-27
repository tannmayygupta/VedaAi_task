# AI Assessment Extraction & Answer Mapping

VedaAI hiring assignment. Upload a question paper and a student's handwritten answer sheet;
the app extracts questions and answers, maps them together, highlights the exact answer region
per question, and grades with AI feedback.

**Live demo:** https://vedaai-task.vercel.app/

Approach & AI model used: [`APPROACH.md`](APPROACH.md) — the submission writeup, covering the
pipeline, key decisions, and assumptions/limitations in plain language.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in GEMINI_API_KEY and BLOB_READ_WRITE_TOKEN
npm run dev
```

- `GEMINI_API_KEY` — a Google AI Studio API key (free tier), used for all extraction/mapping/
  grading calls. Get one at https://aistudio.google.com/apikey.
- `BLOB_READ_WRITE_TOKEN` — required because uploads go directly from the browser to Vercel Blob
  storage, not through this app's own API routes (Vercel Functions cap request bodies at 4.5MB,
  too small for two 10MB files — see `docs/DECISIONS.md`). Create a Blob store under your Vercel
  project (Storage tab) and copy its read-write token; for local dev, `vercel env pull` after
  linking the project also works.

## Deployment

Deployed on Vercel, linked to this repo's default branch. In the Vercel project's
Settings → Environment Variables, set `GEMINI_API_KEY` and `BLOB_READ_WRITE_TOKEN` (same values
as `.env.local`, entered directly in the Vercel dashboard — never committed). No other
infrastructure is required: no database, no auth provider.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` / `npm run typecheck` — static checks
- `npm run test` / `npm run test:watch` — Vitest test suite

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Google Gemini (`gemini-3.6-flash` via
`@google/genai`) for extraction/mapping/grading, Vercel Blob for direct client-side file uploads,
deployed on Vercel. Full rationale for every non-trivial choice is in `docs/DECISIONS.md`.
