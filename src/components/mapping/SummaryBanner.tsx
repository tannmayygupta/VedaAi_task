"use client";

import { Download } from "lucide-react";
import { formatMappingSummary, type MappingSummary } from "@/lib/mapping/mappingSummary";

export type SummaryBannerProps = {
  summary: MappingSummary;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  onExportJson: () => void;
};

export function SummaryBanner({
  summary,
  allExpanded,
  onToggleExpandAll,
  onExportJson,
}: SummaryBannerProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-base font-bold text-ink-primary">
          Extracted Questions (from question paper)
        </p>
        <p className="text-sm text-ink-secondary">{formatMappingSummary(summary)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportJson}
          aria-label="Export as JSON"
          className="flex items-center gap-1.5 overflow-clip rounded-pill bg-surface-white py-3 pl-4 pr-5 text-sm font-medium text-[#181818]"
        >
          <Download className="size-4" aria-hidden="true" />
          Export JSON
        </button>
        <button
          type="button"
          onClick={onToggleExpandAll}
          className="overflow-clip rounded-pill bg-surface-white py-3 pl-4 pr-5 text-sm font-medium text-[#181818]"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>
    </div>
  );
}
