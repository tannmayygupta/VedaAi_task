"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type PageNavigatorProps = {
  currentPageIndex: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function PageNavigator({
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
}: PageNavigatorProps) {
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex >= totalPages - 1;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
      <button
        type="button"
        aria-label="Previous page"
        disabled={isFirstPage}
        onClick={onPrevPage}
        className={`text-white ${isFirstPage ? "cursor-not-allowed opacity-40" : ""}`}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm font-bold text-white">
        Page {currentPageIndex + 1} of {totalPages}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={isLastPage}
        onClick={onNextPage}
        className={`text-white ${isLastPage ? "cursor-not-allowed opacity-40" : ""}`}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
