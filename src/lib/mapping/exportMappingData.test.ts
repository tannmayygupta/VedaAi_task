import { describe, expect, it, vi, afterEach } from "vitest";
import { serializeMappingData, downloadJson, exportMappingDataAsJson } from "./exportMappingData";
import type { MappingData } from "./useMappingData";

function makeData(): MappingData {
  return {
    questions: [{ id: "q1" } as MappingData["questions"][number]],
    regions: [],
    gradings: [],
    summary: {
      totalAwarded: 2,
      totalPossible: 2,
      percentage: 100,
      unansweredCount: 0,
      unmatchedRegionCount: 0,
      totalQuestionCount: 1,
    },
  };
}

describe("serializeMappingData", () => {
  it("pretty-prints the full mapping data as JSON", () => {
    const json = serializeMappingData(makeData());
    expect(JSON.parse(json)).toEqual(makeData());
    expect(json).toContain("\n"); // pretty-printed, not minified
  });
});

describe("downloadJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates an object URL, clicks a download link, then revokes the URL", () => {
    const createObjectURL = vi.fn(() => "blob:fake-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadJson("test.json", '{"a":1}');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });
});

describe("exportMappingDataAsJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("downloads the mapping data under a fixed filename", () => {
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:fake-url"), revokeObjectURL: vi.fn() });
    let capturedFilename = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      capturedFilename = this.download;
    });

    exportMappingDataAsJson(makeData());

    expect(capturedFilename).toBe("assessment-export.json");
  });
});
