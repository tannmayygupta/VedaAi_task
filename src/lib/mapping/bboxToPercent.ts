export type NormalizedBoundingBox = { yMin: number; xMin: number; yMax: number; xMax: number };
export type PercentBox = { top: string; left: string; width: string; height: string };

/**
 * Converts a Gemini-native normalized bounding box (0-1000 scale, origin
 * top-left) into CSS percentage strings suitable for absolutely positioning
 * an overlay div inside a same-aspect-ratio container (e.g. an `object-fit:
 * contain` image). 0-1000 maps directly to 0%-100%.
 */
export function bboxToPercent(box: NormalizedBoundingBox): PercentBox {
  const toPercent = (value: number) => `${(value / 1000) * 100}%`;
  return {
    top: toPercent(box.yMin),
    left: toPercent(box.xMin),
    width: toPercent(box.xMax - box.xMin),
    height: toPercent(box.yMax - box.yMin),
  };
}
