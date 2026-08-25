import { describe, expect, it } from "vitest";
import { countPagesForSlotFiles, countPagesInPdf } from "./pageCount";

function buildFakePdf(pageCount: number): File {
  const kids = Array.from({ length: pageCount }, (_, i) => `${i + 2} 0 R`).join(" ");
  const pagesObj = `1 0 obj\n<< /Type /Pages /Count ${pageCount} /Kids [${kids}] >>\nendobj\n`;
  const pageObjs = Array.from(
    { length: pageCount },
    (_, i) => `${i + 2} 0 obj\n<< /Type /Page /Parent 1 0 R >>\nendobj\n`,
  ).join("");
  return new File([pagesObj + pageObjs], "test.pdf", { type: "application/pdf" });
}

describe("countPagesInPdf", () => {
  it("counts /Type /Page objects without double-counting the /Type /Pages root", async () => {
    const file = buildFakePdf(3);
    await expect(countPagesInPdf(file)).resolves.toBe(3);
  });

  it("falls back to 1 when no recognizable page markers are found", async () => {
    const file = new File(["not a pdf at all"], "empty.pdf", { type: "application/pdf" });
    await expect(countPagesInPdf(file)).resolves.toBe(1);
  });
});

describe("countPagesForSlotFiles", () => {
  it("returns 0 for an empty file list", async () => {
    await expect(countPagesForSlotFiles([])).resolves.toBe(0);
  });

  it("returns the file count for multiple images", async () => {
    const images = [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
      new File(["c"], "c.png", { type: "image/png" }),
    ];
    await expect(countPagesForSlotFiles(images)).resolves.toBe(3);
  });

  it("returns 1 for a single image", async () => {
    const image = new File(["a"], "a.png", { type: "image/png" });
    await expect(countPagesForSlotFiles([image])).resolves.toBe(1);
  });

  it("delegates to countPagesInPdf for a single PDF", async () => {
    const pdf = buildFakePdf(4);
    await expect(countPagesForSlotFiles([pdf])).resolves.toBe(4);
  });
});
