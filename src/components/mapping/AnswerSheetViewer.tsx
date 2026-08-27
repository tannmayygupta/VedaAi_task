"use client";

import { useState } from "react";
import { ZoomControl } from "./ZoomControl";
import { PageNavigator } from "./PageNavigator";
import { AnswerHighlight } from "./AnswerHighlight";
import { PdfPageCanvas } from "./PdfPageCanvas";
import {
  resolveAnswerSheetPageSource,
  getAnswerSheetPageCount,
  PDF_URL_PATTERN,
} from "@/lib/mapping/answerSheetPageSource";
import { usePdfDocument } from "@/lib/mapping/usePdfDocument";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

export type AnswerSheetViewerProps = {
  blobUrls: string[];
  currentPageIndex: number;
  onGoToPage: (pageIndex: number) => void;
  highlightRegions: AnswerRegion[];
  highlightLabel: string | null;
};

// Fixed render resolution for PDF pages — high enough to stay crisp at the
// zoom control's max (200%). Zoom itself is applied via CSS on the wrapper,
// same as the image path, rather than re-rendering the PDF on every zoom
// step (see docs/DECISIONS.md).
const PDF_RENDER_SCALE = 2;

export function AnswerSheetViewer({
  blobUrls,
  currentPageIndex,
  onGoToPage,
  highlightRegions,
  highlightLabel,
}: AnswerSheetViewerProps) {
  const [zoomPercent, setZoomPercent] = useState(100);

  const url = blobUrls[0] ?? null;
  const isPdf = url !== null && PDF_URL_PATTERN.test(url);
  const pdfDocument = usePdfDocument(isPdf ? url : null);

  const totalPages = isPdf
    ? pdfDocument.status === "ready"
      ? pdfDocument.numPages
      : 1
    : getAnswerSheetPageCount(blobUrls);
  const pageSource = isPdf ? null : resolveAnswerSheetPageSource(blobUrls, currentPageIndex);
  const regionsOnThisPage = highlightRegions.filter((r) => r.pageIndex === currentPageIndex);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-[1.25px] border-black/10 bg-surface-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b-[1.25px] border-black/10 bg-surface-dark-grey px-6 py-3">
        <p className="font-bold text-white/80">Answer Sheet</p>
        <div className="flex items-center gap-3">
          <ZoomControl
            zoomPercent={zoomPercent}
            onZoomOut={() => setZoomPercent((z) => Math.max(50, z - 10))}
            onZoomIn={() => setZoomPercent((z) => Math.min(200, z + 10))}
          />
          <PageNavigator
            currentPageIndex={currentPageIndex}
            totalPages={totalPages}
            onPrevPage={() => onGoToPage(Math.max(0, currentPageIndex - 1))}
            onNextPage={() => onGoToPage(Math.min(totalPages - 1, currentPageIndex + 1))}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
        {isPdf && pdfDocument.status === "loading" && (
          <p className="text-sm text-ink-secondary">Loading answer sheet…</p>
        )}
        {isPdf && pdfDocument.status === "error" && (
          <p className="text-sm text-ink-secondary">
            Couldn&apos;t preview this PDF: {pdfDocument.message}
          </p>
        )}
        {isPdf && pdfDocument.status === "ready" && (
          <div
            className="relative flex max-h-full max-w-full shrink-0"
            style={{ transform: `scale(${zoomPercent / 100})` }}
          >
            <PdfPageCanvas
              getPage={pdfDocument.getPage}
              pageNumber={currentPageIndex + 1}
              scale={PDF_RENDER_SCALE}
              className="max-h-full max-w-full rounded-lg"
            />
            {regionsOnThisPage.map((region) => (
              <AnswerHighlight
                key={region.id}
                boundingBox={region.boundingBox}
                label={highlightLabel ?? ""}
              />
            ))}
          </div>
        )}
        {!isPdf && pageSource?.kind === "image" && (
          <div
            className="relative flex max-h-full max-w-full shrink-0"
            style={{ transform: `scale(${zoomPercent / 100})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- externally-hosted Blob URL, next/image is unnecessary here */}
            <img
              src={pageSource.url}
              alt={`Answer sheet page ${currentPageIndex + 1}`}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            {regionsOnThisPage.map((region) => (
              <AnswerHighlight
                key={region.id}
                boundingBox={region.boundingBox}
                label={highlightLabel ?? ""}
              />
            ))}
          </div>
        )}
        {!isPdf && !pageSource && <p className="text-sm text-ink-secondary">No page to display.</p>}
      </div>
    </div>
  );
}
