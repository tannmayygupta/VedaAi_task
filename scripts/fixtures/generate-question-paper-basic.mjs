import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "test-fixtures");
fs.mkdirSync(outDir, { recursive: true });

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(path.join(outDir, "question-paper-basic.pdf")));

doc.fontSize(16).text("Class 8 General Knowledge — Class Test", { align: "center" });
doc.moveDown();
doc.fontSize(10).text("Answer all questions. Time: 1 hour.", { align: "center" });
doc.moveDown(2);
doc.fontSize(12);

function q(num, text, marks) {
  doc.text(`${num}. ${text}${marks ? `  [${marks} marks]` : ""}`);
  doc.moveDown();
}
function sub(num, letter, text, marks) {
  doc.text(`${num}(${letter}) ${text}${marks ? `  [${marks} marks]` : ""}`, { indent: 20 });
  doc.moveDown();
}

q(1, "Name the largest planet in our solar system.");
q(2, "Which river is known as the lifeline of Egypt?");
q(3, "Name the currency used in Japan.", 2);
q(4, "List the seven continents of the world.", 3);
doc.text("5. A country has two neighbouring states, State X and State Y, that share a long border.");
doc.moveDown();
sub(5, "a", "Name one advantage of two neighbouring states sharing a free-trade agreement.", 2);
sub(5, "b", "Suggest one challenge that can arise from a long shared border.", 2);
sub(5, "c", "Explain briefly why border disputes are often difficult to resolve.", 3);
q(6, "Name the tallest mountain in the world.", 1);
q(7, "Which ocean is the largest by surface area?");

doc.end();

const groundTruth = [
  { number: "1", subpart: null, displayLabel: "1", text: "Name the largest planet in our solar system.", marksTotal: null },
  { number: "2", subpart: null, displayLabel: "2", text: "Which river is known as the lifeline of Egypt?", marksTotal: null },
  { number: "3", subpart: null, displayLabel: "3", text: "Name the currency used in Japan.", marksTotal: 2 },
  { number: "4", subpart: null, displayLabel: "4", text: "List the seven continents of the world.", marksTotal: 3 },
  { number: "5", subpart: "a", displayLabel: "5 (a)", text: "Name one advantage of two neighbouring states sharing a free-trade agreement.", marksTotal: 2 },
  { number: "5", subpart: "b", displayLabel: "5 (b)", text: "Suggest one challenge that can arise from a long shared border.", marksTotal: 2 },
  { number: "5", subpart: "c", displayLabel: "5 (c)", text: "Explain briefly why border disputes are often difficult to resolve.", marksTotal: 3 },
  { number: "6", subpart: null, displayLabel: "6", text: "Name the tallest mountain in the world.", marksTotal: 1 },
  { number: "7", subpart: null, displayLabel: "7", text: "Which ocean is the largest by surface area?", marksTotal: null },
];
fs.writeFileSync(
  path.join(outDir, "question-paper-basic.ground-truth.json"),
  JSON.stringify(groundTruth, null, 2),
);
console.log("Wrote question-paper-basic.pdf and ground-truth JSON");
