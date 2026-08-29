import { describe, expect, it } from "vitest";
import { hasFullPageCoverage, maxPageCovered, maxValidPageCovered } from "./pageCoverage";

describe("maxPageCovered", () => {
  it("returns -1 for no regions", () => {
    expect(maxPageCovered([])).toBe(-1);
  });

  it("returns the highest pageIndex across regions", () => {
    expect(maxPageCovered([{ pageIndex: 2 }, { pageIndex: 7 }, { pageIndex: 4 }])).toBe(7);
  });
});

describe("maxValidPageCovered", () => {
  it("ignores a hallucinated out-of-range pageIndex (the real 'Page 16 of 15' case)", () => {
    // A 15-page document is pageIndex 0-14; a region claiming pageIndex 15
    // must not count as reaching the end.
    expect(
      maxValidPageCovered(
        [{ pageIndex: 0 }, { pageIndex: 2 }, { pageIndex: 15 }],
        15,
      ),
    ).toBe(2);
  });

  it("ignores a negative pageIndex", () => {
    expect(maxValidPageCovered([{ pageIndex: -1 }, { pageIndex: 3 }], 15)).toBe(3);
  });

  it("returns -1 when every pageIndex is out of range", () => {
    expect(maxValidPageCovered([{ pageIndex: 20 }], 15)).toBe(-1);
  });

  it("matches maxPageCovered when everything is in range", () => {
    expect(maxValidPageCovered([{ pageIndex: 4 }, { pageIndex: 14 }], 15)).toBe(14);
  });
});

describe("hasFullPageCoverage", () => {
  it("is true when totalPages can't be determined", () => {
    expect(hasFullPageCoverage([{ pageIndex: 0 }], null)).toBe(true);
  });

  it("is true for a single-page (or empty) document regardless of regions", () => {
    expect(hasFullPageCoverage([], 1)).toBe(true);
    expect(hasFullPageCoverage([], 0)).toBe(true);
  });

  it("is true when the regions reach the last page", () => {
    expect(hasFullPageCoverage([{ pageIndex: 14 }], 15)).toBe(true);
  });

  it("is true when only within the small allowed trailing gap (e.g. a blank last page)", () => {
    expect(hasFullPageCoverage([{ pageIndex: 12 }], 15)).toBe(true); // gap of 2
  });

  it("is false for the real observed failure case (stops well before the last page)", () => {
    expect(hasFullPageCoverage([{ pageIndex: 8 }], 15)).toBe(false); // gap of 6
  });

  it("is false even when one region has a hallucinated out-of-range pageIndex hiding real under-coverage", () => {
    // Real observed case: 3 regions total, one claiming pageIndex 15 on a
    // 15-page (0-indexed 0-14) document, with the rest at low page indices.
    expect(
      hasFullPageCoverage([{ pageIndex: 0 }, { pageIndex: 1 }, { pageIndex: 15 }], 15),
    ).toBe(false);
  });
});
