import { z } from "zod";

// What the client sends: one crop image per answer region, keyed by index so
// the model's response (which returns image index, not the real regionId —
// see docs/PRD.md §16) can be mapped back to the right region.
export const CrossCheckRequestSchema = z.object({
  crops: z
    .array(
      z.object({
        regionId: z.string().min(1),
        dataUrl: z.string().startsWith("data:image/"),
        geminiTranscription: z.string(),
      }),
    )
    .min(1),
});
export type CrossCheckRequest = z.infer<typeof CrossCheckRequestSchema>;

// What GPT is asked to return: one transcription per image, in the same
// order the images were sent (0-indexed) — validated, then re-associated
// with the real regionId server-side before responding to the client.
export const GptTranscriptionArraySchema = z.object({
  transcriptions: z
    .array(
      z.object({
        index: z.number().int().min(0),
        transcription: z.string(),
      }),
    )
    .min(1),
});
export type GptTranscriptionArray = z.infer<typeof GptTranscriptionArraySchema>;

export const HandwritingCrossCheckSchema = z.object({
  regionId: z.string().min(1),
  gptTranscription: z.string(),
  agrees: z.boolean(),
});
export type HandwritingCrossCheck = z.infer<typeof HandwritingCrossCheckSchema>;
