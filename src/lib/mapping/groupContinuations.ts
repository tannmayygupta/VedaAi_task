import type { AnswerRegion } from "@/lib/schemas/answerRegion";

/**
 * Groups a flat AnswerRegion[] into chains: each chain is an array of regions
 * in continuation order (the region with continuesFromRegionId: null first,
 * followed by whichever region continues from it, and so on). A region with
 * no continuation relationship at all forms its own single-element chain.
 * Assumes at most one region continues from any given region (no branching).
 */
export function groupContinuations(regions: AnswerRegion[]): AnswerRegion[][] {
  const byId = new Map(regions.map((r) => [r.id, r]));
  const continuerOf = new Map<string, AnswerRegion>();
  for (const region of regions) {
    if (region.continuesFromRegionId && byId.has(region.continuesFromRegionId)) {
      if (!continuerOf.has(region.continuesFromRegionId)) {
        continuerOf.set(region.continuesFromRegionId, region);
      }
    }
  }

  const chains: AnswerRegion[][] = [];
  for (const region of regions) {
    const isHead =
      !region.continuesFromRegionId || !byId.has(region.continuesFromRegionId);
    if (!isHead) continue;

    const chain: AnswerRegion[] = [region];
    // Guards against a malformed model response forming a continuation cycle
    // (e.g. r1 continues from r2 and r2 continues from r1), which would
    // otherwise loop forever.
    const visited = new Set<string>([region.id]);
    let current = region;
    while (continuerOf.has(current.id)) {
      const next = continuerOf.get(current.id)!;
      if (visited.has(next.id)) break;
      visited.add(next.id);
      chain.push(next);
      current = next;
    }
    chains.push(chain);
  }
  return chains;
}

/**
 * Returns the region ids belonging to the same chain as the given region id
 * (including itself), in chain order. Returns just [regionId] if it isn't
 * part of any multi-region chain (or doesn't exist in `regions`).
 */
export function getChainForRegionId(regions: AnswerRegion[], regionId: string): string[] {
  const chains = groupContinuations(regions);
  const chain = chains.find((c) => c.some((r) => r.id === regionId));
  return chain ? chain.map((r) => r.id) : [regionId];
}
