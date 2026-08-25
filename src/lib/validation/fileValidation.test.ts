import { describe, expect, it } from "vitest";
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  validateFile,
  validateFiles,
} from "./fileValidation";

function makeFile(name: string, type: string, size: number): File {
  const file = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateFile", () => {
  it("accepts a valid PDF under the size limit", () => {
    const file = makeFile("paper.pdf", "application/pdf", 1024);
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it("accepts a valid image under the size limit", () => {
    const file = makeFile("scan.png", "image/png", 2048);
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it("rejects an unsupported mime type", () => {
    const file = makeFile("archive.zip", "application/zip", 1024);
    expect(validateFile(file)).toEqual({ valid: false, reason: "invalid-type" });
  });

  it("rejects a file over the size limit", () => {
    const file = makeFile("huge.pdf", "application/pdf", MAX_FILE_SIZE_BYTES + 1);
    expect(validateFile(file)).toEqual({ valid: false, reason: "too-large" });
  });

  it("prioritizes invalid-type over too-large when both fail", () => {
    const file = makeFile("huge.zip", "application/zip", MAX_FILE_SIZE_BYTES + 1);
    expect(validateFile(file)).toEqual({ valid: false, reason: "invalid-type" });
  });

  it("exposes the accepted mime types and size limit", () => {
    expect(ACCEPTED_MIME_TYPES).toContain("application/pdf");
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe("validateFiles", () => {
  it("returns valid for an empty array", () => {
    expect(validateFiles([])).toEqual({ valid: true });
  });

  it("returns valid when every file passes", () => {
    const files = [
      makeFile("a.pdf", "application/pdf", 1024),
      makeFile("b.jpg", "image/jpeg", 1024),
    ];
    expect(validateFiles(files)).toEqual({ valid: true });
  });

  it("returns the first failure found", () => {
    const files = [
      makeFile("a.pdf", "application/pdf", 1024),
      makeFile("bad.zip", "application/zip", 1024),
      makeFile("c.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES + 1),
    ];
    expect(validateFiles(files)).toEqual({ valid: false, reason: "invalid-type" });
  });
});
