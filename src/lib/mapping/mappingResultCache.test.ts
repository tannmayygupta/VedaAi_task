import { describe, expect, it, vi, beforeEach } from "vitest";
import { readMappingCache, writeMappingCache } from "./mappingResultCache";
import type { MappingData } from "./useMappingData";

function makeData(): MappingData {
  return {
    questions: [],
    regions: [],
    gradings: [],
    summary: {
      totalAwarded: 0,
      totalPossible: 0,
      percentage: 0,
      unansweredCount: 0,
      unmatchedRegionCount: 0,
      totalQuestionCount: 0,
    },
  };
}

describe("mappingResultCache", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns null when nothing is cached for this URL pair", () => {
    expect(readMappingCache("qp.pdf", "as.pdf")).toBeNull();
  });

  it("round-trips a written result", () => {
    const data = makeData();
    writeMappingCache("qp.pdf", "as.pdf", data);
    expect(readMappingCache("qp.pdf", "as.pdf")).toEqual(data);
  });

  it("keys the cache by both URLs — a different pair is a cache miss", () => {
    writeMappingCache("qp.pdf", "as.pdf", makeData());
    expect(readMappingCache("qp.pdf", "different-as.pdf")).toBeNull();
    expect(readMappingCache("different-qp.pdf", "as.pdf")).toBeNull();
  });

  it("degrades silently (returns null / does not throw) when sessionStorage throws", () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(() => readMappingCache("qp.pdf", "as.pdf")).not.toThrow();
    expect(readMappingCache("qp.pdf", "as.pdf")).toBeNull();
    getSpy.mockRestore();

    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => writeMappingCache("qp.pdf", "as.pdf", makeData())).not.toThrow();
    setSpy.mockRestore();
  });
});
