# AI Assessment Extraction & Answer Mapping

VedaAI hiring assignment. Upload a question paper and a student's handwritten answer sheet;
the app extracts questions and answers, maps them together, highlights the exact answer region
per question, and grades with AI feedback.

Full spec: [`docs/PRD.md`](docs/PRD.md). Build progress: [`docs/TRACKER.md`](docs/TRACKER.md).
Decision log: [`docs/DECISIONS.md`](docs/DECISIONS.md). Submission writeup:
[`docs/APPROACH.md`](docs/APPROACH.md).

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in GEMINI_API_KEY and BLOB_READ_WRITE_TOKEN
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` / `npm run typecheck` — static checks
- `npm run test` / `npm run test:watch` — Vitest test suite

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Google Gemini for extraction/mapping/grading,
Vercel Blob for direct client-side file uploads, deployed on Vercel. Full rationale for every
non-trivial choice is in `docs/DECISIONS.md`.
