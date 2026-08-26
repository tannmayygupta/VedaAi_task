// Generates test-fixtures/answer-sheet-unlabeled.pdf — a synthetic answer
// sheet with NO question labels/numbers anywhere, stress-testing the hardest
// part of Phase 4 matching (PRD §7): sequential inference + semantic content
// matching with zero label crutch. Answers original placeholder content
// against the real, Phase-3-verified questions in
// test-fixtures/question-paper-basic.ground-truth.json.
//
// GROUND TRUTH (paragraph, by first few words -> expected question id):
//   "The largest planet is Jupiter..."                    -> q1  (in printed order)
//   "The Nile river is considered..."                      -> q2  (in printed order)
//   "The continents are Asia, Africa..."                   -> q4  (OUT OF ORDER: answered before q3)
//   "Japan's currency is called the Yen."                  -> q3  (OUT OF ORDER: answered after q4)
//   (no content addresses q5-a, q5-b, or q5-c — section 5 is entirely skipped/unanswered)
//   "I really enjoyed the school trip..."                  -> unmatched (off-topic, no question addresses a school trip)
//   "The tallest mountain in the world is Mount Everest..." -> q6
//   "The Pacific Ocean is the largest ocean..."            -> q7
//
// Run: node scripts/fixtures/generate-answer-sheet-unlabeled.mjs

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "test-fixtures");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "answer-sheet-unlabeled.pdf");

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(outPath));

doc.fontSize(11);

function para(text) {
  doc.text(text);
  doc.moveDown();
}

para("The largest planet is Jupiter, which is a gas giant.");
para("The Nile river is considered the lifeline of Egypt since ancient times.");
para(
  "The continents are Asia, Africa, Europe, North America, South America, Australia, and Antarctica.",
);
para("Japan's currency is called the Yen.");
para("I really enjoyed the school trip to the science museum last month, it was very educational.");
para(
  "The tallest mountain in the world is Mount Everest, located on the border of Nepal and Tibet.",
);
para("The Pacific Ocean is the largest ocean by surface area.");

doc.end();
console.log("Written to", outPath);
