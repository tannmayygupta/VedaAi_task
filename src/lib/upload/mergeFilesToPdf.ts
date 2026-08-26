import { PDFDocument } from "pdf-lib";

/**
 * Converts an image File to PNG bytes via canvas. Used only for webp, which
 * pdf-lib cannot embed natively (it only supports JPEG and PNG).
 */
export async function convertImageToPngBytes(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("Failed to encode image as PNG");
  }
  return new Uint8Array(await blob.arrayBuffer());
}

async function addImagePage(pdf: PDFDocument, file: File): Promise<void> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const image =
    file.type === "image/jpeg"
      ? await pdf.embedJpg(bytes)
      : file.type === "image/png"
        ? await pdf.embedPng(bytes)
        : await pdf.embedPng(await convertImageToPngBytes(file));

  const page = pdf.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
}

async function addPdfPages(pdf: PDFDocument, file: File): Promise<void> {
  const bytes = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(bytes);
  const copiedPages = await pdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  copiedPages.forEach((page) => pdf.addPage(page));
}

/**
 * Merges any mix of PDF and image files (in the given order) into a single
 * PDF File, one page per image and every page of any input PDF preserved in
 * order. Lets a teacher's multi-image answer sheet reuse the same
 * fully-supported single-PDF pipeline (Gemini page indexing, page
 * navigation) instead of needing separate multi-image handling — see
 * docs/DECISIONS.md.
 */
export async function mergeFilesToPdf(
  files: File[],
  mergedFileName = "merged-answer-sheet.pdf",
): Promise<File> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    if (file.type === "application/pdf") {
      await addPdfPages(mergedPdf, file);
    } else {
      await addImagePage(mergedPdf, file);
    }
  }

  const mergedBytes = await mergedPdf.save();
  return new File([mergedBytes as BlobPart], mergedFileName, { type: "application/pdf" });
}
