"use client";

import { useState } from "react";
import { ZoomControl } from "./ZoomControl";
import { PageNavigator } from "./PageNavigator";
import { AnswerHighlight } from "./AnswerHighlight";
import {
  resolveAnswerSheetPageSource,
  getAnswerSheetPageCount,
} from "@/lib/mapping/answerSheetPageSource";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

export type AnswerSheetViewerProps = {
  blobUrls: string[];
  currentPageIndex: number;
  onGoToPage: (pageIndex: number) => void;
  highlightRegions: AnswerRegion[];
  highlightLabel: string | null;
};

export function AnswerSheetViewer({
  blobUrls,
  currentPageIndex,
  onGoToPage,
  highlightRegions,
  highlightLabel,
}: AnswerSheetViewerProps) {
  const [zoomPercent, setZoomPercent] = useState(100);

  const totalPages = getAnswerSheetPageCount(blobUrls);
  const pageSource = resolveAnswerSheetPageSource(blobUrls, currentPageIndex);
  const regionsOnThisPage = highlightRegions.filter((r) => r.pageIndex === currentPageIndex);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl border-[1.25px] border-black/10 bg-surface-white">
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

      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {pageSource?.kind === "image" && (
          <div className="relative" style={{ width: `${zoomPercent}%`, maxWidth: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- externally-hosted Blob URL, next/image is unnecessary here */}
            <img
              src={pageSource.url}
              alt={`Answer sheet page ${currentPageIndex + 1}`}
              className="w-full rounded-lg"
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
        {pageSource?.kind === "unsupported-pdf-page" && (
          <div className="max-w-sm text-center text-sm text-ink-secondary">
            <p>
              This answer sheet is a PDF — page-by-page preview isn&apos;t available yet, but
              extraction and mapping across every page still works correctly.
            </p>
          </div>
        )}
        {!pageSource && <p className="text-sm text-ink-secondary">No page to display.</p>}
      </div>
    </div>
  );
}
