import Image from "next/image";

export type LoadingScreenProps = {
  message?: string;
};

/**
 * Matches the Figma "Loading state" frame exactly (desktop node 1:9305's
 * mobile counterpart): a static icon (no glow/pulse — Figma defines no
 * Effects on it) and a fixed "This may take a while" subtext, no percentage.
 * Used for both the upload-to-Blob phase and the AI-extraction phase — Figma
 * defines only one generic loading state, not a distinct per-phase one.
 */
export function LoadingScreen({ message = "Extracting…" }: LoadingScreenProps) {
  return (
    <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-surface-white px-4">
      <Image
        src="/illustrations/processing-exptraction-page-center-logo.svg"
        alt=""
        width={129}
        height={135}
        className="size-20"
        priority
      />
      <p className="text-center text-[30px] font-bold text-ink-primary">{message}</p>
      <p className="text-xl text-ink-secondary">This may take a while</p>
    </div>
  );
}
