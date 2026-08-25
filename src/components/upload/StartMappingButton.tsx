"use client";

import { ArrowRight } from "lucide-react";

export type StartMappingButtonProps = {
  enabled: boolean;
  onClick: () => void;
};

export function StartMappingButton({ enabled, onClick }: StartMappingButtonProps) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-pill border-2 border-white/15 bg-surface-dark-grey py-3 pl-6 pr-5 text-sm font-medium text-ink-inverse ${
        enabled ? "shadow-realistic" : "cursor-not-allowed opacity-25"
      }`}
    >
      <span>Start Mapping</span>
      <ArrowRight className="size-5" />
    </button>
  );
}
