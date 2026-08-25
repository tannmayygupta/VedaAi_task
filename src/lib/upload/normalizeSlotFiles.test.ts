import { describe, expect, it, vi, beforeEach } from "vitest";
import { normalizeSlotFiles } from "./normalizeSlotFiles";
import { validateFiles } from "../validation/fileValidation";
import { countPagesForSlotFiles } from "../validation/pageCount";

vi.mock("../validation/fileValidation", () => ({
  validateFiles: vi.fn(() => ({ valid: true })),
}));

vi.mock("../validation/pageCount", () => ({
  countPagesForSlotFiles: vi.fn(async () => 3),
}));

const mockedValidateFiles = vi.mocked(validateFiles);
const mockedCountPagesForSlotFiles = vi.mocked(countPagesForSlotFiles);

function makeFile(name: string, type: string, size: number): File {
  const file = new File([new Uint8Array(size)], name, { type });
  return file;
}

describe("normalizeSlotFiles", () => {
  beforeEach(() => {
    mockedValidateFiles.mockClear();
    mockedCountPagesForSlotFiles.mockClear();
    mockedValidateFiles.mockReturnValue({ valid: true });
    mockedCountPagesForSlotFiles.mockResolvedValue(3);
  });

  it("classifies an empty array as kind 'empty' with zeroed totals", async () => {
    mockedCountPagesForSlotFiles.mockResolvedValue(0);

    const result = await normalizeSlotFiles([]);

    expect(result.kind).toBe("empty");
    expect(result.totalPages).toBe(0);
    expect(result.totalSizeBytes).toBe(0);
    expect(result.files).toEqual([]);
  });

  it("classifies a single PDF file as kind 'pdf'", async () => {
    const pdf = makeFile("paper.pdf", "application/pdf", 1000);

    const result = await normalizeSlotFiles([pdf]);

    expect(result.kind).toBe("pdf");
  });

  it("classifies multiple image files as kind 'images'", async () => {
    const img1 = makeFile("page1.png", "image/png", 500);
    const img2 = makeFile("page2.png", "image/png", 500);

    const result = await normalizeSlotFiles([img1, img2]);

    expect(result.kind).toBe("images");
  });

  it("classifies a single image file as kind 'images' (not 'pdf')", async () => {
    const img = makeFile("page1.jpg", "image/jpeg", 500);

    const result = await normalizeSlotFiles([img]);

    expect(result.kind).toBe("images");
  });

  it("sums totalSizeBytes across multiple files", async () => {
    const img1 = makeFile("page1.png", "image/png", 500);
    const img2 = makeFile("page2.png", "image/png", 700);
    const img3 = makeFile("page3.png", "image/png", 300);

    const result = await normalizeSlotFiles([img1, img2, img3]);

    expect(result.totalSizeBytes).toBe(1500);
  });

  it("passes through a valid validation result", async () => {
    mockedValidateFiles.mockReturnValue({ valid: true });
    const img = makeFile("page1.png", "image/png", 500);

    const result = await normalizeSlotFiles([img]);

    expect(result.validation).toEqual({ valid: true });
  });

  it("passes through an invalid validation result", async () => {
    mockedValidateFiles.mockReturnValue({ valid: false, reason: "too-large" });
    const img = makeFile("page1.png", "image/png", 500);

    const result = await normalizeSlotFiles([img]);

    expect(result.validation).toEqual({ valid: false, reason: "too-large" });
  });

  it("calls validateFiles and countPagesForSlotFiles with the same files array passed in", async () => {
    const img1 = makeFile("page1.png", "image/png", 500);
    const img2 = makeFile("page2.png", "image/png", 500);
    const files = [img1, img2];

    await normalizeSlotFiles(files);

    expect(mockedValidateFiles).toHaveBeenCalledWith(files);
    expect(mockedCountPagesForSlotFiles).toHaveBeenCalledWith(files);
  });

  it("passes through the totalPages value from countPagesForSlotFiles", async () => {
    mockedCountPagesForSlotFiles.mockResolvedValue(7);
    const img = makeFile("page1.png", "image/png", 500);

    const result = await normalizeSlotFiles([img]);

    expect(result.totalPages).toBe(7);
  });
});
