import { getPdfDocument } from "@/lib/pdf/pdfjs";

export async function countPagesInPdf(file: File): Promise<number> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getPdfDocument(bytes);
  return pdf.numPages;
}

export async function countPagesForSlotFiles(files: File[]): Promise<number> {
  if (files.length === 0) return 0;
  if (files.length > 1) return files.length;

  const [file] = files;
  if (file.type === "application/pdf") {
    return countPagesInPdf(file);
  }
  return 1;
}
