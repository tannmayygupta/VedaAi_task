import { z } from "zod";

export const BoundingBoxSchema = z
  .object({
    yMin: z.number().int().min(0).max(1000),
    xMin: z.number().int().min(0).max(1000),
    yMax: z.number().int().min(0).max(1000),
    xMax: z.number().int().min(0).max(1000),
  })
  .refine((b) => b.yMax > b.yMin && b.xMax > b.xMin, {
    message: "boundingBox must have yMax > yMin and xMax > xMin",
  });

export const AnswerRegionSchema = z.object({
  id: z.string().min(1),
  pageIndex: z.number().int().min(0),
  boundingBox: BoundingBoxSchema,
  transcribedText: z.string(),
  detectedLabel: z.string().nullable(),
  matchedQuestionId: z.string().nullable(),
  matchConfidence: z.number().min(0).max(1),
  continuesFromRegionId: z.string().nullable(),
});

export const AnswerRegionArraySchema = z.array(AnswerRegionSchema).superRefine((regions, ctx) => {
  const ids = new Set(regions.map((r) => r.id));
  regions.forEach((r, i) => {
    if (r.continuesFromRegionId && !ids.has(r.continuesFromRegionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [i, "continuesFromRegionId"],
        message: `continuesFromRegionId "${r.continuesFromRegionId}" does not reference any region id in this response`,
      });
    }
  });
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
export type AnswerRegion = z.infer<typeof AnswerRegionSchema>;
