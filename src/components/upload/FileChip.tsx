"use client";

import { FileText, X } from "lucide-react";

export type FileChipProps = {
  fileName: string;
  fileSizeLabel: string;
  pageCount: number;
  onRemove: () => void;
};

export function FileChip({ fileName, fileSizeLabel, pageCount, onRemove }: FileChipProps) {
  const pageLabel = pageCount === 1 ? "1 Page" : `${pageCount} Pages`;

  return (
    <div className="relative flex h-full flex-1 items-center justify-center overflow-clip rounded-xl border-[1.5px] border-dashed border-[#cecece] bg-surface-white p-2.5">
      <div className="flex w-full min-w-0 flex-1 items-center gap-3 rounded-md bg-surface-off-white py-3 pl-3 pr-5">
        <FileText className="size-6 shrink-0 text-ink-secondary" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <p className="w-full truncate text-base font-bold text-ink-primary">{fileName}</p>
          <p className="w-full truncate text-sm text-ink-secondary/80">
            {fileSizeLabel} &bull; {pageLabel}
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-label="Remove file"
        onClick={onRemove}
        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-[rgba(43,43,43,0.8)] text-ink-inverse shadow-md"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
