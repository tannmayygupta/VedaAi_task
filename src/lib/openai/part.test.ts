import { describe, expect, it } from "vitest";
import { fileBytesToDataUri, buildOpenAiFileInput } from "./part";

describe("fileBytesToDataUri", () => {
  it("builds a data URI with the given mime type and base64-encoded bytes", () => {
    const bytes = new TextEncoder().encode("hello").buffer;
    const uri = fileBytesToDataUri(bytes, "application/pdf");
    expect(uri).toBe(`data:application/pdf;base64,${Buffer.from("hello").toString("base64")}`);
  });
});

describe("buildOpenAiFileInput", () => {
  it("routes an image mime type to the images param", () => {
    const bytes = new TextEncoder().encode("img").buffer;
    const result = buildOpenAiFileInput(bytes, "image/png", "answer-sheet.png");
    expect(result.files).toBeUndefined();
    expect(result.images).toEqual([`data:image/png;base64,${Buffer.from("img").toString("base64")}`]);
  });

  it("routes a PDF mime type to the files param with the given filename", () => {
    const bytes = new TextEncoder().encode("pdf").buffer;
    const result = buildOpenAiFileInput(bytes, "application/pdf", "answer-sheet.pdf");
    expect(result.images).toBeUndefined();
    expect(result.files).toEqual([
      { dataUri: `data:application/pdf;base64,${Buffer.from("pdf").toString("base64")}`, filename: "answer-sheet.pdf" },
    ]);
  });
});
