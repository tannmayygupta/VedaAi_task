export type GeminiPart = { text: string } | { inlineData: { data: string; mimeType: string } };

export function textPart(text: string): GeminiPart {
  return { text };
}

export function fileBytesToPart(bytes: ArrayBuffer, mimeType: string): GeminiPart {
  const base64 = Buffer.from(bytes).toString("base64");
  return { inlineData: { data: base64, mimeType } };
}
