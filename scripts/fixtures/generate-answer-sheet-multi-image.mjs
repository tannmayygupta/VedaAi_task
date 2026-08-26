// Generates two separate JPEG images (not a PDF) — test-fixtures/answer-sheet-multi-image-page1.jpg
// and page2.jpg — simulating a teacher photographing each page of a two-page answer sheet
// separately instead of scanning to one PDF. Used to verify the client-side pdf-lib merge
// (src/lib/upload/mergeFilesToPdf.ts) that turns N selected images into one PDF before upload,
// so the existing single-PDF Gemini pipeline handles both pages correctly. Same underlying
// content/ground truth as answer-sheet-basic.pdf (see generate-answer-sheet-basic.mjs), split
// across two images instead of two PDF pages, against the same question set in
// test-fixtures/question-paper-basic.pdf.
//
// Run: node scripts/fixtures/generate-answer-sheet-multi-image.mjs

import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "test-fixtures");
fs.mkdirSync(outDir, { recursive: true });

const pageStyle = `
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
  }
  p { margin: 0 0 0 0; }
  .header { font-size: 18px; color: #444; margin-bottom: 20px; }
`;

const pages = [
  `
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
  `,
  `
  <div class="page">
    <p>challenging peaks to climb in the world due to its extreme</p>
    <p>altitude and weather conditions.</p>
    <p>&nbsp;</p>
    <p>Q7. The Pacific Ocean is the largest ocean by surface area,</p>
    <p>covering more than 60 million square miles.</p>
  </div>
  `,
];

function htmlFor(pageBody) {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&display=swap" rel="stylesheet">
<style>${pageStyle}</style>
</head>
<body>${pageBody}</body>
</html>
`;
}

let fontLoadPath = "google-fonts";
const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 816, height: 1056 });

  for (let i = 0; i < pages.length; i++) {
    const html = htmlFor(pages[i]);
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
    const outPath = path.join(outDir, `answer-sheet-multi-image-page${i + 1}.jpg`);
    const element = await page.$(".page");
    await element.screenshot({ path: outPath, type: "jpeg", quality: 92 });
    const stats = fs.statSync(outPath);
    console.log(`Written to ${outPath} (${stats.size} bytes).`);
  }
} finally {
  await browser.close();
  console.log(`Font path: ${fontLoadPath}`);
}
