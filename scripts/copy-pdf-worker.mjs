// Copies pdfjs-dist's worker file into public/ so it can be served as a static
// asset. This sidesteps a known Turbopack bug where pdfjs-dist's own dynamic
// worker-loading code can't be statically resolved (see docs/DECISIONS.md).
// Runs automatically via the "postinstall" script so it stays in sync with
// whatever pdfjs-dist version is installed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(
  __dirname,
  "..",
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs",
);
const destDir = path.join(__dirname, "..", "public");
const dest = path.join(destDir, "pdf.worker.min.mjs");

if (!fs.existsSync(src)) {
  console.warn(`pdfjs-dist worker not found at ${src} — skipping copy (is pdfjs-dist installed?)`);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Copied pdf.worker.min.mjs to ${dest}`);
