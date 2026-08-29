import { describe, expect, it } from "vitest";
import {
  resolveAnswerSheetPageSource,
  getAnswerSheetPageCount,
  clampPageIndex,
} from "./answerSheetPageSource";

const imageUrls = [
  "https://blob.example/page1.jpg",
  "https://blob.example/page2.png",
  "https://blob.example/page3.jpg",
];

describe("resolveAnswerSheetPageSource", () => {
  it("returns the correct image for a given page index", () => {
    expect(resolveAnswerSheetPageSource(imageUrls, 1)).toEqual({
      kind: "image",
      url: "https://blob.example/page2.png",
    });
  });

  it("returns null for an empty array", () => {
    expect(resolveAnswerSheetPageSource([], 0)).toBeNull();
  });

  it("returns null for an out-of-bounds page index", () => {
    expect(resolveAnswerSheetPageSource(imageUrls, 5)).toBeNull();
  });
});

describe("getAnswerSheetPageCount", () => {
  it("returns the array length for multiple image URLs", () => {
    expect(getAnswerSheetPageCount(imageUrls)).toBe(3);
  });

  it("returns 0 for an empty array", () => {
    expect(getAnswerSheetPageCount([])).toBe(0);
  });
});

describe("clampPageIndex", () => {
  it("leaves an in-range index unchanged", () => {
    expect(clampPageIndex(5, 15)).toBe(5);
    expect(clampPageIndex(0, 15)).toBe(0);
    expect(clampPageIndex(14, 15)).toBe(14);
  });

  it("clamps an index at or past totalPages down to the last valid page", () => {
    // The real observed case: a 15-page document (valid indices 0-14), a
    // region reporting pageIndex 15.
    expect(clampPageIndex(15, 15)).toBe(14);
    expect(clampPageIndex(100, 15)).toBe(14);
  });

  it("clamps a negative index up to 0", () => {
    expect(clampPageIndex(-1, 15)).toBe(0);
  });
});
