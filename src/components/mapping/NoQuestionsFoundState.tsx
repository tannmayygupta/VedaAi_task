import { SearchX } from "lucide-react";

/**
 * Shown when extraction succeeds (HTTP 200, not an error) but genuinely
 * finds zero questions in the question paper — PRD §10: "explicit
 * 'couldn't find any questions in this file' message, not a blank list."
 */
export function NoQuestionsFoundState() {
  return (
    <div className="flex h-full min-h-[600px] flex-col items-center justify-center gap-3 text-center">
      <SearchX className="size-12 text-surface-disabled" />
      <p className="text-lg font-bold text-ink-primary">
        Couldn&apos;t find any questions in this file
      </p>
      <p className="text-sm text-ink-secondary">
        Try a different question paper, or check that the file uploaded correctly.
      </p>
    </div>
  );
}
