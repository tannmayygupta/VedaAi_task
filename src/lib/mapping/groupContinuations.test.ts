import { describe, expect, it } from "vitest";
import { groupContinuations, getChainForRegionId } from "./groupContinuations";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

function makeRegion(overrides: Partial<AnswerRegion> & { id: string }): AnswerRegion {
  return {
    pageIndex: 0,
    boundingBox: { yMin: 0, xMin: 0, yMax: 100, xMax: 100 },
    transcribedText: "",
    detectedLabel: null,
    matchedQuestionId: null,
    matchConfidence: 1,
    continuesFromRegionId: null,
    ...overrides,
  };
}

describe("groupContinuations", () => {
  it("puts each region with no continuation into its own single-element chain", () => {
    const regions = [makeRegion({ id: "r1" }), makeRegion({ id: "r2" }), makeRegion({ id: "r3" })];
    const chains = groupContinuations(regions);
    expect(chains).toHaveLength(3);
    expect(chains.map((c) => c.map((r) => r.id))).toEqual([["r1"], ["r2"], ["r3"]]);
  });

  it("groups a two-region chain in order", () => {
    const r1 = makeRegion({ id: "r1" });
    const r2 = makeRegion({ id: "r2", continuesFromRegionId: "r1" });
    const chains = groupContinuations([r1, r2]);
    expect(chains).toHaveLength(1);
    expect(chains[0].map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("groups a three-region chain in order", () => {
    const r1 = makeRegion({ id: "r1" });
    const r2 = makeRegion({ id: "r2", continuesFromRegionId: "r1" });
    const r3 = makeRegion({ id: "r3", continuesFromRegionId: "r2" });
    const chains = groupContinuations([r3, r1, r2]);
    expect(chains).toHaveLength(1);
    expect(chains[0].map((r) => r.id)).toEqual(["r1", "r2", "r3"]);
  });

  it("treats a region whose continuesFromRegionId points outside the array as its own root", () => {
    const r1 = makeRegion({ id: "r1", continuesFromRegionId: "does-not-exist" });
    const chains = groupContinuations([r1]);
    expect(chains).toHaveLength(1);
    expect(chains[0].map((r) => r.id)).toEqual(["r1"]);
  });

  it("separates multiple independent chains/singletons and accounts for every region exactly once", () => {
    const a1 = makeRegion({ id: "a1" });
    const a2 = makeRegion({ id: "a2", continuesFromRegionId: "a1" });
    const b1 = makeRegion({ id: "b1" });
    const c1 = makeRegion({ id: "c1" });
    const c2 = makeRegion({ id: "c2", continuesFromRegionId: "c1" });
    const c3 = makeRegion({ id: "c3", continuesFromRegionId: "c2" });
    const regions = [a1, a2, b1, c1, c2, c3];
    const chains = groupContinuations(regions);
    expect(chains).toHaveLength(3);
    const totalRegions = chains.reduce((sum, chain) => sum + chain.length, 0);
    expect(totalRegions).toBe(regions.length);
    expect(chains.map((c) => c.map((r) => r.id))).toEqual(
      expect.arrayContaining([["a1", "a2"], ["b1"], ["c1", "c2", "c3"]]),
    );
  });
});

describe("getChainForRegionId", () => {
  it("returns the full chain's ids for a region in a multi-region chain", () => {
    const r1 = makeRegion({ id: "r1" });
    const r2 = makeRegion({ id: "r2", continuesFromRegionId: "r1" });
    expect(getChainForRegionId([r1, r2], "r2")).toEqual(["r1", "r2"]);
  });

  it("returns just the region's own id when it isn't part of a multi-region chain", () => {
    const r1 = makeRegion({ id: "r1" });
    expect(getChainForRegionId([r1], "r1")).toEqual(["r1"]);
  });
});
