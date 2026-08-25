import { describe, expect, it } from "vitest";
import { formatFileSize } from "./format";

describe("formatFileSize", () => {
  it("formats sub-megabyte sizes in KB", () => {
    expect(formatFileSize(2048)).toBe("2KB");
  });

  it("formats whole megabyte sizes without decimals", () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2MB");
  });

  it("formats fractional megabyte sizes with one decimal", () => {
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5MB");
  });

  it("never reports 0KB for a tiny nonzero file", () => {
    expect(formatFileSize(10)).toBe("1KB");
  });
});
