"use client";

import { useState, type ReactNode } from "react";

export type TooltipProps = {
  label: string;
  children: ReactNode;
};

/**
 * Hover tooltip for desktop, with a tap-to-toggle fallback for touch devices
 * (which have no `:hover` state, so the CSS-only version never showed
 * anything there — the trigger is also made focusable so it works via
 * keyboard, not just mouse/touch).
 */
export function Tooltip({ label, children }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="group relative inline-flex focus-within:z-10"
      tabIndex={0}
      role="button"
      aria-label={label}
      onClick={() => setOpen((o) => !o)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md bg-surface-dark-grey px-3 py-2 text-xs font-normal text-white shadow-realistic transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </span>
    </span>
  );
}
