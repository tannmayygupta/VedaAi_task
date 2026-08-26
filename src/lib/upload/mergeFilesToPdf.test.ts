import { describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergeFilesToPdf } from "./mergeFilesToPdf";

// 1x1 white pixel, real encoded bytes so pdf-lib's embedPng/embedJpg can parse them.
const ONE_PX_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const ONE_PX_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function makeFile(name: string, type: string, bytes: Uint8Array): File {
  return new File([bytes as BlobPart], name, { type });
}

async function makePdfFile(name: string, pageCount: number): Promise<File> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([200, 200]);
  }
  const bytes = await pdf.save();
  return makeFile(name, "application/pdf", bytes);
}

describe("mergeFilesToPdf", () => {
  it("merges a PNG and a JPEG into a single PDF with one page each, in order", async () => {
    const png = makeFile("page1.png", "image/png", base64ToUint8Array(ONE_PX_PNG_BASE64));
    const jpeg = makeFile("page2.jpg", "image/jpeg", base64ToUint8Array(ONE_PX_JPEG_BASE64));

    const merged = await mergeFilesToPdf([png, jpeg]);

    expect(merged.type).toBe("application/pdf");
    const mergedPdf = await PDFDocument.load(await merged.arrayBuffer());
    expect(mergedPdf.getPageCount()).toBe(2);
  });

  it("preserves every page of input PDFs, across multiple PDFs", async () => {
    const pdfA = await makePdfFile("a.pdf", 2);
    const pdfB = await makePdfFile("b.pdf", 3);

    const merged = await mergeFilesToPdf([pdfA, pdfB]);

    const mergedPdf = await PDFDocument.load(await merged.arrayBuffer());
    expect(mergedPdf.getPageCount()).toBe(5);
  });

  it("supports a mix of PDF and image files in the given order", async () => {
    const pdfA = await makePdfFile("a.pdf", 2);
    const png = makeFile("page.png", "image/png", base64ToUint8Array(ONE_PX_PNG_BASE64));

    const merged = await mergeFilesToPdf([pdfA, png]);

    const mergedPdf = await PDFDocument.load(await merged.arrayBuffer());
    expect(mergedPdf.getPageCount()).toBe(3);
  });

  it("converts webp images to PNG before embedding, since pdf-lib has no native webp support", async () => {
    // jsdom has no real image/canvas decoding, so stub the browser APIs
    // convertImageToPngBytes relies on and verify the webp branch still
    // produces a valid single-page PDF end-to-end.
    const pngBytes = base64ToUint8Array(ONE_PX_PNG_BASE64);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 1, height: 1 }) as unknown as ImageBitmap),
    );
    const getContext = vi.fn(() => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D);
    const toBlob = vi.fn((callback: BlobCallback) =>
      callback(new Blob([pngBytes as BlobPart], { type: "image/png" })),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(getContext);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(toBlob);

    try {
      const webp = makeFile("page.webp", "image/webp", new Uint8Array([1, 2, 3]));
      const merged = await mergeFilesToPdf([webp]);

      const mergedPdf = await PDFDocument.load(await merged.arrayBuffer());
      expect(mergedPdf.getPageCount()).toBe(1);
      expect(getContext).toHaveBeenCalled();
      expect(toBlob).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });
});
