import type { ScoreTier } from "@/lib/schemas/grading";

export type ScoreTierClasses = {
  background: string; // Tailwind bg-* class using the tint token
  text: string; // Tailwind text-* class using the solid token
};

const SCORE_TIER_STYLES: Record<ScoreTier, ScoreTierClasses> = {
  full: { background: "bg-success-tint", text: "text-success" },
  partial: { background: "bg-warning-tint", text: "text-warning" },
  zero: { background: "bg-danger-tint", text: "text-danger" },
  unanswered: { background: "bg-surface-off-white-20", text: "text-surface-disabled" },
};

export function getScoreTierClasses(tier: ScoreTier): ScoreTierClasses {
  return SCORE_TIER_STYLES[tier];
}
