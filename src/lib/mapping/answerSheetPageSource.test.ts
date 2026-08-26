import { describe, expect, it } from "vitest";
import { resolveAnswerSheetPageSource, getAnswerSheetPageCount } from "./answerSheetPageSource";

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
