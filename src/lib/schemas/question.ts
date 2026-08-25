import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  subpart: z.string().nullable(),
  displayLabel: z.string().min(1),
  text: z.string().min(1),
  marksTotal: z.number().nullable(),
  pageIndex: z.number().int().min(0),
  order: z.number().int().min(0),
});

export const QuestionArraySchema = z.array(QuestionSchema);

export type Question = z.infer<typeof QuestionSchema>;
