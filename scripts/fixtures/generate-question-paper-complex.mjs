// Generates test-fixtures/question-paper-complex.pdf — a synthetic question paper
// stressing PRD §6's "preserve original numbering exactly as printed" rule with a
// non-numeric section and an intentional numbering gap. Original placeholder content.
//
// GROUND TRUTH (in reading order, exact printed numbering):
//   Section A (Roman numerals):
//     i.   "Explain why ice floats on water."                                    (no marks stated)
//     ii.  "State one difference between an acid and a base."                    (no marks stated)
//     iii. "Name the SI unit of electric current."                               (no marks stated)
//   Section B (numeric, WITH A GAP — question 8 was removed after a paper
//   revision; printed numbering jumps 7 -> 9, it must NOT be renumbered to 8):
//     6. "Describe the function of the xylem in a plant."                        [2 marks]
//     7. "A ball is thrown vertically upward with an initial velocity of 20 m/s.
//         Calculate the maximum height it reaches. (g = 10 m/s^2). Show your working." [3 marks]
//     9. "Explain the difference between conductors and insulators, giving one
//         example of each."                                                     (no marks stated)
//
// Run: node scripts/fixtures/generate-question-paper-complex.mjs

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "test-fixtures");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "question-paper-complex.pdf");

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(outPath));

doc.fontSize(16).text("Class 9 General Science — Revised Unit Test", { align: "center" });
doc.moveDown();
doc.fontSize(10).text("Answer all questions. Time: 45 minutes.", { align: "center" });
doc.moveDown(2);

doc.fontSize(13).text("Section A", { underline: true });
doc.moveDown(0.5);

// Simple two-column layout for Section A: i & ii on the left, iii on the right,
// starting at the same y position.
const sectionAY = doc.y;
const leftX = 50;
const rightX = 320;
const colWidth = 240;

doc.fontSize(11);
doc.text("i. Explain why ice floats on water.", leftX, sectionAY, { width: colWidth });
doc.moveDown();
doc.text("ii. State one difference between an acid and a base.", leftX, doc.y, { width: colWidth });

doc.text("iii. Name the SI unit of electric current.", rightX, sectionAY, { width: colWidth });

doc.y = Math.max(doc.y, sectionAY + 100);
doc.x = 50;
doc.moveDown(2);

doc.fontSize(13).text("Section B", { underline: true });
doc.moveDown(0.5);
doc.fontSize(11);

doc.text("6. Describe the function of the xylem in a plant.  [2 marks]");
doc.moveDown();
doc.text(
  "7. A ball is thrown vertically upward with an initial velocity of 20 m/s. Calculate the " +
    "maximum height it reaches. (g = 10 m/s^2). Show your working.  [3 marks]",
);
doc.moveDown();
doc.text(
  "9. Explain the difference between conductors and insulators, giving one example of each.",
);

doc.end();
console.log("Written to", outPath);
