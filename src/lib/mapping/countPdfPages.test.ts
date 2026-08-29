import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { countPdfPages } from "./countPdfPages";

async function makePdfBytes(pageCount: number): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([100, 100]);
  }
  const bytes = await pdf.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

describe("countPdfPages", () => {
  it("returns 1 for a non-PDF mimeType without inspecting the bytes", async () => {
    expect(await countPdfPages(new ArrayBuffer(0), "image/jpeg")).toBe(1);
  });

  it("returns the real page count for a valid multi-page PDF", async () => {
    const bytes = await makePdfBytes(15);
    expect(await countPdfPages(bytes, "application/pdf")).toBe(15);
  });

  it("returns 1 for a valid single-page PDF", async () => {
    const bytes = await makePdfBytes(1);
    expect(await countPdfPages(bytes, "application/pdf")).toBe(1);
  });

  it("returns null when the bytes claim to be a PDF but don't parse as one", async () => {
    expect(await countPdfPages(new ArrayBuffer(8), "application/pdf")).toBeNull();
  });
});
