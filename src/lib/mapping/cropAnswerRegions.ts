import type { AnswerRegion, BoundingBox } from "@/lib/schemas/answerRegion";
import { PDF_URL_PATTERN, resolveAnswerSheetPageSource } from "./answerSheetPageSource";

export type RegionCrop = { regionId: string; dataUrl: string };

// Matches AnswerSheetViewer's PDF_RENDER_SCALE — same resolution the teacher
// already sees, so the crop GPT reads is exactly what a human would.
const CROP_RENDER_SCALE = 2;

function cropSourceToDataUrl(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  box: BoundingBox,
): string {
  const sx = (box.xMin / 1000) * sourceWidth;
  const sy = (box.yMin / 1000) * sourceHeight;
  const sw = ((box.xMax - box.xMin) / 1000) * sourceWidth;
  const sh = ((box.yMax - box.yMin) / 1000) * sourceHeight;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2D canvas context for cropping");
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function groupRegionsByPage(regions: AnswerRegion[]): Map<number, AnswerRegion[]> {
  const map = new Map<number, AnswerRegion[]>();
  for (const region of regions) {
    const list = map.get(region.pageIndex) ?? [];
    list.push(region);
    map.set(region.pageIndex, list);
  }
  return map;
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Needed so the canvas we draw this onto isn't "tainted" (which would
    // block toDataURL) — requires the Blob host to send a permissive CORS
    // header; verified against a real uploaded file in a real browser (see
    // docs/TRACKER.md Phase 9), not assumed.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Crops each answer region out of its rendered answer-sheet page, client-side,
 * for the Phase 9 handwriting cross-check (docs/PRD.md §16). Reuses the same
 * normalized-bbox math as the highlight overlay (bboxToPercent.ts) — just in
 * pixel space instead of CSS percentages — and the same pdfjs-dist rendering
 * approach as PdfPageCanvas.tsx, rendered off-screen since the teacher never
 * needs to see this intermediate step.
 */
export async function cropAnswerRegions(
  blobUrls: string[],
  regions: AnswerRegion[],
): Promise<RegionCrop[]> {
  const url = blobUrls[0];
  if (!url || regions.length === 0) return [];

  const regionsByPage = groupRegionsByPage(regions);
  const crops: RegionCrop[] = [];

  if (PDF_URL_PATTERN.test(url)) {
    const { getPdfDocument } = await import("@/lib/pdf/pdfjs");
    const pdf = await getPdfDocument(url);
    for (const [pageIndex, pageRegions] of regionsByPage) {
      const page = await pdf.getPage(pageIndex + 1); // pdfjs pages are 1-indexed
      const viewport = page.getViewport({ scale: CROP_RENDER_SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      for (const region of pageRegions) {
        crops.push({
          regionId: region.id,
          dataUrl: cropSourceToDataUrl(canvas, canvas.width, canvas.height, region.boundingBox),
        });
      }
    }
  } else {
    for (const [pageIndex, pageRegions] of regionsByPage) {
      const pageSource = resolveAnswerSheetPageSource(blobUrls, pageIndex);
      if (!pageSource) continue;
      const img = await loadImageElement(pageSource.url);
      for (const region of pageRegions) {
        crops.push({
          regionId: region.id,
          dataUrl: cropSourceToDataUrl(img, img.naturalWidth, img.naturalHeight, region.boundingBox),
        });
      }
    }
  }

  return crops;
}
