"use client";

import { useEffect, useState } from "react";
import { Dropzone } from "./Dropzone";
import { FileChip } from "./FileChip";
import { normalizeSlotFiles } from "@/lib/upload/normalizeSlotFiles";
import { formatFileSize } from "@/lib/format";
import type { UploadSlotState } from "@/lib/upload/useUploadFlow";

export type UploadSlotCardProps = {
  label: string;
  accentLabel: string;
  slotState: UploadSlotState;
  onFilesSelected: (files: File[]) => void;
  onRemove: () => void;
};

const ERROR_MESSAGES: Record<NonNullable<UploadSlotState["error"]>, string> = {
  "invalid-type": "Unsupported file type — use PDF, JPG, PNG, or WEBP.",
  "too-large": "File is too large — max 10MB per file.",
};

const UNREADABLE_FILE_MESSAGE = "Couldn't read this file — it may be corrupted. Try a different file.";

export function UploadSlotCard({
  label,
  accentLabel,
  slotState,
  onFilesSelected,
  onRemove,
}: UploadSlotCardProps) {
  const [pageCount, setPageCount] = useState(1);
  const [unreadable, setUnreadable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cancelled) setUnreadable(false);
      if (slotState.files.length === 0) {
        return;
      }
      try {
        const summary = await normalizeSlotFiles(slotState.files);
        if (!cancelled) {
          setPageCount(summary.totalPages);
        }
      } catch {
        // e.g. a corrupted PDF that passed type/size validation but pdfjs-dist
        // can't parse for a page count — surface it instead of leaving the
        // file chip silently showing a stale/wrong page count.
        if (!cancelled) {
          setUnreadable(true);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [slotState.files]);

  return (
    <div className="flex h-full flex-1 flex-col gap-2">
      {slotState.files.length > 0 ? (
        <FileChip
          fileName={
            slotState.files.length === 1
              ? slotState.files[0].name
              : `${slotState.files.length} images`
          }
          fileSizeLabel={formatFileSize(
            slotState.files.reduce((sum, file) => sum + file.size, 0),
          )}
          pageCount={pageCount}
          onRemove={onRemove}
        />
      ) : (
        <Dropzone label={label} accentLabel={accentLabel} onFilesSelected={onFilesSelected} />
      )}
      {slotState.error && (
        <p className="text-sm text-danger">{ERROR_MESSAGES[slotState.error]}</p>
      )}
      {unreadable && <p className="text-sm text-danger">{UNREADABLE_FILE_MESSAGE}</p>}
    </div>
  );
}
