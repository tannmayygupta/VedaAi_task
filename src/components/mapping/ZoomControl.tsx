"use client";

import { Minus, Plus } from "lucide-react";

export type ZoomControlProps = {
  zoomPercent: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  min?: number;
  max?: number;
};

export function ZoomControl({
  zoomPercent,
  onZoomOut,
  onZoomIn,
  min = 50,
  max = 200,
}: ZoomControlProps) {
  const canZoomOut = zoomPercent > min;
  const canZoomIn = zoomPercent < max;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
      <button
        type="button"
        aria-label="Zoom out"
        disabled={!canZoomOut}
        onClick={onZoomOut}
        className={`text-white ${!canZoomOut ? "cursor-not-allowed opacity-40" : ""}`}
      >
        <Minus className="size-4" />
      </button>
      <span className="text-sm font-bold text-white">{zoomPercent}%</span>
      <button
        type="button"
        aria-label="Zoom in"
        disabled={!canZoomIn}
        onClick={onZoomIn}
        className={`text-white ${!canZoomIn ? "cursor-not-allowed opacity-40" : ""}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
