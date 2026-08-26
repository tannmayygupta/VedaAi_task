"use client";

import { bboxToPercent } from "@/lib/mapping/bboxToPercent";

export type BoundingBoxOverlayProps = {
  imageUrl: string;
  boxes: Array<{
    id: string;
    boundingBox: { yMin: number; xMin: number; yMax: number; xMax: number };
    label?: string;
  }>;
};

export function BoundingBoxOverlay({ imageUrl, boxes }: BoundingBoxOverlayProps) {
  return (
    <div className="relative inline-block w-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- dev-only debug tool, next/image is overkill here */}
      <img src={imageUrl} alt="" className="block w-full object-contain" />
      {boxes.map((box) => {
        const percent = bboxToPercent(box.boundingBox);
        return (
          <div
            key={box.id}
            className="absolute border-2 border-green-500"
            style={{
              top: percent.top,
              left: percent.left,
              width: percent.width,
              height: percent.height,
            }}
          >
            {box.label && (
              <span className="absolute -top-5 left-0 whitespace-nowrap bg-green-500 px-1 text-xs text-white">
                {box.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
