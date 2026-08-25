import { describe, expect, it } from "vitest";
import { textPart, fileBytesToPart } from "./part";

describe("textPart", () => {
  it("wraps a string into a { text } part", () => {
    expect(textPart("hello")).toEqual({ text: "hello" });
  });
});

describe("fileBytesToPart", () => {
  it("base64-encodes the given bytes and attaches the mime type", () => {
    const bytes = new TextEncoder().encode("hi").buffer;
    const expectedBase64 = Buffer.from(bytes).toString("base64");

    const part = fileBytesToPart(bytes, "application/pdf");

    expect(part).toEqual({
      inlineData: {
        data: expectedBase64,
        mimeType: "application/pdf",
      },
    });
  });

  it("produces different base64 output for different byte content", () => {
    const bytesA = new TextEncoder().encode("aaa").buffer;
    const bytesB = new TextEncoder().encode("bbb").buffer;

    const partA = fileBytesToPart(bytesA, "image/png");
    const partB = fileBytesToPart(bytesB, "image/png");

    expect(partA).not.toEqual(partB);
  });
});
