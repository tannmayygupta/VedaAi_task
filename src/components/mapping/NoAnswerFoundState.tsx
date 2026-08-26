import { SearchX } from "lucide-react";

export type NoAnswerFoundStateProps = {
  questionLabel: string;
};

export function NoAnswerFoundState({ questionLabel }: NoAnswerFoundStateProps) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 text-center">
      <SearchX className="size-12 text-surface-disabled" />
      <p className="text-lg font-bold text-ink-primary">No answer found for {questionLabel}</p>
      <p className="text-sm text-ink-secondary">
        This question doesn&apos;t appear to have been answered on the sheet.
      </p>
    </div>
  );
}
