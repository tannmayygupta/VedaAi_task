import { z } from "zod";

export const CorrectnessSchema = z.enum(["correct", "partial", "incorrect", "unanswered"]);

export const GradingSchema = z
  .object({
    questionId: z.string().min(1),
    marksAwarded: z.number().min(0),
    marksTotal: z.number().min(0),
    correctness: CorrectnessSchema,
    feedback: z.string(),
  })
  .refine((g) => g.marksAwarded <= g.marksTotal, {
    message: "marksAwarded cannot exceed marksTotal",
  });

export const GradingArraySchema = z.array(GradingSchema);

export type Correctness = z.infer<typeof CorrectnessSchema>;
export type Grading = z.infer<typeof GradingSchema>;

export type GradingSummary = {
  totalAwarded: number;
  totalPossible: number;
  percentage: number;
  unansweredCount: number;
};

export function summarizeGradings(gradings: Grading[]): GradingSummary {
  const totalAwarded = gradings.reduce((sum, g) => sum + g.marksAwarded, 0);
  const totalPossible = gradings.reduce((sum, g) => sum + g.marksTotal, 0);
  const percentage = totalPossible === 0 ? 0 : Math.round((totalAwarded / totalPossible) * 100);
  const unansweredCount = gradings.filter((g) => g.correctness === "unanswered").length;

  return { totalAwarded, totalPossible, percentage, unansweredCount };
}

export type ScoreTier = "full" | "partial" | "zero" | "unanswered";

export function scoreTier(
  grading: Pick<Grading, "marksAwarded" | "marksTotal" | "correctness">,
): ScoreTier {
  if (grading.correctness === "unanswered") {
    return "unanswered";
  }
  if (grading.marksTotal > 0 && grading.marksAwarded === grading.marksTotal) {
    return "full";
  }
  if (grading.marksAwarded === 0) {
    return "zero";
  }
  return "partial";
}
