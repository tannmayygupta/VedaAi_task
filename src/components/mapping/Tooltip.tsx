"use client";

import type { ReactNode } from "react";

export type TooltipProps = {
  label: string;
  children: ReactNode;
};

/** Simple hover tooltip (CSS-only, no positioning library needed for this scale). */
export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-md bg-surface-dark-grey px-3 py-2 text-xs font-normal text-white opacity-0 shadow-realistic transition-opacity group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
