import { describe, expect, it, vi } from "vitest";
import { countPagesForSlotFiles, countPagesInPdf } from "./pageCount";

const { getPdfDocumentMock } = vi.hoisted(() => ({ getPdfDocumentMock: vi.fn() }));

vi.mock("@/lib/pdf/pdfjs", () => ({
  getPdfDocument: getPdfDocumentMock,
}));

function buildFakePdf(): File {
  return new File(["%PDF-1.4 fake content"], "test.pdf", { type: "application/pdf" });
}

describe("countPagesInPdf", () => {
  it("returns the real page count from pdfjs-dist", async () => {
    getPdfDocumentMock.mockResolvedValueOnce({ numPages: 3 });
    await expect(countPagesInPdf(buildFakePdf())).resolves.toBe(3);
  });

  it("returns 1 for a single-page PDF", async () => {
    getPdfDocumentMock.mockResolvedValueOnce({ numPages: 1 });
    await expect(countPagesInPdf(buildFakePdf())).resolves.toBe(1);
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
    getPdfDocumentMock.mockResolvedValueOnce({ numPages: 4 });
    await expect(countPagesForSlotFiles([buildFakePdf()])).resolves.toBe(4);
  });
});
