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

export function UploadSlotCard({
  label,
  accentLabel,
  slotState,
  onFilesSelected,
  onRemove,
}: UploadSlotCardProps) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (slotState.files.length === 0) {
      return;
    }
    let cancelled = false;
    normalizeSlotFiles(slotState.files).then((summary) => {
      if (!cancelled) {
        setPageCount(summary.totalPages);
      }
    });
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
    </div>
  );
}
