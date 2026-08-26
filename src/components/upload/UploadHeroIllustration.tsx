import Image from "next/image";

/**
 * Decorative illustration on the upload screen (Figma: "Frame 1618872259") —
 * exported directly from Figma (see docs/DECISIONS.md) at 137x138 to match
 * the design pixel-for-pixel.
 */
export function UploadHeroIllustration() {
  return (
    <Image
      src="/illustrations/upload-hero-illustration.svg"
      alt=""
      width={138}
      height={138}
      className="size-[138px] shrink-0"
      priority
    />
  );
}
