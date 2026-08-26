import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

const getPdfDocumentMock = vi.fn();
vi.mock("@/lib/pdf/pdfjs", () => ({
  getPdfDocument: (...args: unknown[]) => getPdfDocumentMock(...args),
}));

const { cropAnswerRegions } = await import("./cropAnswerRegions");

function makeRegion(overrides: Partial<AnswerRegion> = {}): AnswerRegion {
  return {
    id: "r1",
    pageIndex: 0,
    boundingBox: { yMin: 100, xMin: 200, yMax: 300, xMax: 400 },
    transcribedText: "42",
    detectedLabel: null,
    matchedQuestionId: "q1",
    matchConfidence: 0.9,
    continuesFromRegionId: null,
    ...overrides,
  };
}

const FAKE_DATA_URL = "data:image/png;base64,FAKE";

describe("cropAnswerRegions", () => {
  let drawImage: ReturnType<typeof vi.fn>;
  let toDataURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    drawImage = vi.fn();
    toDataURL = vi.fn(() => FAKE_DATA_URL);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => ({ drawImage }) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(
      toDataURL as unknown as HTMLCanvasElement["toDataURL"],
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    getPdfDocumentMock.mockReset();
  });

  it("returns an empty array when there are no regions", async () => {
    const crops = await cropAnswerRegions(["https://blob.example/sheet.pdf"], []);
    expect(crops).toEqual([]);
  });

  it("returns an empty array when there is no blob URL", async () => {
    const crops = await cropAnswerRegions([], [makeRegion()]);
    expect(crops).toEqual([]);
  });

  describe("PDF answer sheets", () => {
    it("renders the page once and crops each region on it using the normalized bbox math", async () => {
      const fakePage = {
        getViewport: () => ({ width: 1000, height: 2000 }),
        render: () => ({ promise: Promise.resolve() }),
      };
      const fakePdf = { getPage: vi.fn(async () => fakePage) };
      getPdfDocumentMock.mockResolvedValue(fakePdf);

      const region = makeRegion({ id: "r1", boundingBox: { yMin: 100, xMin: 200, yMax: 300, xMax: 400 } });
      const crops = await cropAnswerRegions(["https://blob.example/sheet.pdf"], [region]);

      expect(crops).toEqual([{ regionId: "r1", dataUrl: FAKE_DATA_URL }]);
      // bbox is in 0-1000 normalized space; page is 1000x2000 pixels here.
      // sx = 200/1000*1000 = 200, sy = 100/1000*2000 = 200
      // sw = (400-200)/1000*1000 = 200, sh = (300-100)/1000*2000 = 400
      expect(drawImage).toHaveBeenCalledWith(
        expect.anything(),
        200,
        200,
        200,
        400,
        0,
        0,
        200,
        400,
      );
    });

    it("renders each distinct page only once even with multiple regions on it", async () => {
      const fakePage = {
        getViewport: () => ({ width: 1000, height: 1000 }),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
      };
      const fakePdf = { getPage: vi.fn(async () => fakePage) };
      getPdfDocumentMock.mockResolvedValue(fakePdf);

      const regions = [
        makeRegion({ id: "r1", pageIndex: 0 }),
        makeRegion({ id: "r2", pageIndex: 0 }),
      ];
      const crops = await cropAnswerRegions(["https://blob.example/sheet.pdf"], regions);

      expect(crops.map((c) => c.regionId).sort()).toEqual(["r1", "r2"]);
      expect(fakePage.render).toHaveBeenCalledTimes(1);
    });

    it("uses 1-indexed page numbers for pdfjs (pageIndex 0 -> page 1)", async () => {
      const fakePage = {
        getViewport: () => ({ width: 1000, height: 1000 }),
        render: () => ({ promise: Promise.resolve() }),
      };
      const fakePdf = { getPage: vi.fn(async () => fakePage) };
      getPdfDocumentMock.mockResolvedValue(fakePdf);

      await cropAnswerRegions(["https://blob.example/sheet.pdf"], [makeRegion({ pageIndex: 2 })]);

      expect(fakePdf.getPage).toHaveBeenCalledWith(3);
    });
  });

  describe("image answer sheets", () => {
    it("crops directly from the loaded image using its natural dimensions", async () => {
      class FakeImage {
        naturalWidth = 800;
        naturalHeight = 1600;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
      vi.stubGlobal("Image", FakeImage);

      const region = makeRegion({ id: "r1", boundingBox: { yMin: 0, xMin: 0, yMax: 500, xMax: 500 } });
      const crops = await cropAnswerRegions(["https://blob.example/page1.png"], [region]);

      expect(crops).toEqual([{ regionId: "r1", dataUrl: FAKE_DATA_URL }]);
      // sx=0, sy=0, sw=500/1000*800=400, sh=500/1000*1600=800
      expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 400, 800, 0, 0, 400, 800);

      vi.unstubAllGlobals();
    });

    it("rejects when the image fails to load", async () => {
      class FailingImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      }
      vi.stubGlobal("Image", FailingImage);

      await expect(
        cropAnswerRegions(["https://blob.example/broken.png"], [makeRegion()]),
      ).rejects.toThrow(/Failed to load image/);

      vi.unstubAllGlobals();
    });
  });
});
