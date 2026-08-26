// Generates a synthetic one-page question paper PDF that deliberately varies
// how marks are notated per question, to stress-test that extraction reads
// marksTotal from whatever notation the paper actually uses (PRD §6) and
// never guesses/defaults a value when a question states none at all.
//
// Ground truth (question number -> expected marksTotal, notation used):
//   1 -> 2   inline "[2]"
//   2 -> 3   inline "(3 marks)"
//   3 -> 2   inline "2M"
//   4 -> 4   inline "[Marks: 4]"
//   5 -> null  no marks notation present anywhere for this question
//   6 -> 5   marks stated on their own line below the question text ("[5 marks]")
//
// Run: node scripts/fixtures/generate-question-paper-marks.mjs
// Output: test-fixtures/question-paper-marks.pdf

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(projectRoot, "test-fixtures");
const outPath = path.join(outDir, "question-paper-marks.pdf");

fs.mkdirSync(outDir, { recursive: true });

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(outPath));

doc.fontSize(16).text("Class 9 General Science — Short Quiz", { align: "center" });
doc.moveDown();
doc.fontSize(10).text("Answer all questions.", { align: "center" });
doc.moveDown(2);

doc.fontSize(12);

doc.text("1. State one function of the mitochondria in a cell. [2]");
doc.moveDown();

doc.text("2. Explain why ice floats on water. (3 marks)");
doc.moveDown();

doc.text("3. Name the SI unit of electric current. 2M");
doc.moveDown();

doc.text("4. Describe the role of chlorophyll in photosynthesis. [Marks: 4]");
doc.moveDown();

doc.text("5. What is meant by the term 'biodiversity'?");
doc.moveDown();

doc.text("6. Outline the steps involved in the nitrogen cycle.");
doc.text("[5 marks]");
doc.moveDown();

doc.end();

doc.on("finish", () => {
  console.log("Written to", outPath);
});
