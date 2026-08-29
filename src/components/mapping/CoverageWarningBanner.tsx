import { TriangleAlert } from "lucide-react";

/**
 * Shown when the mapping call (after its own automatic retry) still didn't
 * reach near the answer sheet's last page — see docs/DECISIONS.md
 * "Post-mitigation re-audit of the OpenAI failover". A deliberate deviation
 * from the Figma design, which has no such state: a silent under-read is a
 * worse experience than an extra banner.
 */
export function CoverageWarningBanner() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-warning-tint px-3 py-2 text-sm text-warning">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        The AI may not have fully reviewed every page of this answer sheet — some later answers
        or grades could be missing or inaccurate. Please verify manually.
      </p>
    </div>
  );
}
