// Generates test-fixtures/answer-sheet-basic.pdf — a synthetic handwriting-styled
// student answer sheet used to test the combined Answer Extraction + Mapping step
// (PRD §7) against the question set in test-fixtures/question-paper-basic.pdf.
//
// GROUND TRUTH (content -> matched question id):
//   Page 1:
//     "Q1. Jupiter"                                              -> q1
//     "Q4. The seven continents are..."                          -> q4  (OUT-OF-ORDER: appears before Q3's answer)
//     "Q3. Yen"                                                  -> q3
//     "I think trade between countries is really important..."   -> UNMATCHED (vague, unlabeled)
//     "5(a) One advantage is that goods can move..."             -> q5-a
//     "5(b) A challenge is that disputes can arise..."           -> q5-b
//     "Q6. The tallest mountain... remains one of the most"      -> q6 (cut off, continues on page 2)
//   Page 2:
//     "challenging peaks to climb..."                            -> q6 (continuation of the page-1 region, no label)
//     "Q7. The Pacific Ocean is the largest ocean..."             -> q7
//   q2 and q5-c are deliberately UNANSWERED — no content anywhere on the page for them.
//
// Run: node scripts/fixtures/generate-answer-sheet-basic.mjs

import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "test-fixtures");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "answer-sheet-basic.pdf");

const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&display=swap" rel="stylesheet">
<style>
  @page { margin: 0; }
  body {
    margin: 0;
    font-family: 'Caveat', 'Comic Sans MS', 'Segoe Script', cursive;
    font-size: 22px;
    color: #1a2a6c;
    background-color: #fdfdf5;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 33px,
      #b9d3ee 34px
    );
    line-height: 34px;
  }
  .page {
    box-sizing: border-box;
    width: 816px;
    height: 1056px;
    padding: 60px 70px;
    page-break-after: always;
  }
  .page:last-child { page-break-after: avoid; }
  p { margin: 0 0 0 0; }
  .header { font-size: 18px; color: #444; margin-bottom: 20px; }
</style>
</head>
<body>
  <div class="page">
    <p class="header">Name: A. Student&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Roll No: 12</p>
    <p>Q1. Jupiter</p>
    <p>&nbsp;</p>
    <p>Q4. The seven continents are Asia, Africa, North America, South</p>
    <p>America, Antarctica, Europe, and Australia.</p>
    <p>&nbsp;</p>
    <p>Q3. Yen</p>
    <p>&nbsp;</p>
    <p>I think trade between countries is really important for the</p>
    <p>economy and helps build friendships between nations.</p>
    <p>&nbsp;</p>
    <p>5(a) One advantage is that goods can move without extra taxes,</p>
    <p>making things cheaper for both countries.</p>
    <p>&nbsp;</p>
    <p>5(b) A challenge is that disputes can arise over where exactly</p>
    <p>the border lies.</p>
    <p>&nbsp;</p>
    <p>Q6. The tallest mountain in the world is Mount Everest, located</p>
    <p>in the Himalayas on the border of Nepal and Tibet. It was first</p>
    <p>summited in 1953 by Sir Edmund Hillary and Tenzing Norgay, and</p>
    <p>remains one of the most</p>
  </div>
  <div class="page">
    <p>challenging peaks to climb in the world due to its extreme</p>
    <p>altitude and weather conditions.</p>
    <p>&nbsp;</p>
    <p>Q7. The Pacific Ocean is the largest ocean by surface area,</p>
    <p>covering more than 60 million square miles.</p>
  </div>
</body>
</html>
`;

let fontLoadPath = "google-fonts";
const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 8000 });
  } catch {
    fontLoadPath = "cursive-fallback (google fonts fetch failed/timed out)";
    const fallbackHtml = html.replace(
      /<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/,
      "",
    );
    await page.setContent(fallbackHtml, { waitUntil: "load" });
  }
  await page.pdf({
    path: outPath,
    width: "816px",
    height: "1056px",
    printBackground: true,
  });
} finally {
  await browser.close();
}

const stats = fs.statSync(outPath);
console.log(`Written to ${outPath} (${stats.size} bytes). Font path: ${fontLoadPath}`);
