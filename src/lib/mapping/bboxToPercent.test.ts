import { describe, expect, it } from "vitest";
import { bboxToPercent } from "./bboxToPercent";

describe("bboxToPercent", () => {
  it("converts a full-image box to 0%/0%/100%/100%", () => {
    expect(bboxToPercent({ yMin: 0, xMin: 0, yMax: 1000, xMax: 1000 })).toEqual({
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
    });
  });

  it("converts the bottom-right quadrant correctly", () => {
    expect(bboxToPercent({ yMin: 250, xMin: 500, yMax: 750, xMax: 1000 })).toEqual({
      top: "25%",
      left: "50%",
      width: "50%",
      height: "50%",
    });
  });

  it("converts a non-round box to hand-verified percentages", () => {
    // yMin=100 -> 10%, xMin=100 -> 10%, width=(800-100)/1000*100=70%, height=(300-100)/1000*100=20%
    expect(bboxToPercent({ yMin: 100, xMin: 100, yMax: 300, xMax: 800 })).toEqual({
      top: "10%",
      left: "10%",
      width: "70%",
      height: "20%",
    });
  });
});
