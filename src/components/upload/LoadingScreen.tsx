import Image from "next/image";

export type LoadingScreenProps = {
  message?: string;
};

/**
 * Matches the Figma "Loading state" frame exactly (desktop node 1:9305's
 * mobile counterpart): a static icon (no glow/pulse — Figma defines no
 * Effects on it) and a fixed "This may take a while" subtext, no percentage.
 * Used for both the upload-to-Blob phase and the AI-extraction phase — Figma
 * defines only one generic loading state visually; callers pass a distinct
 * `message` per phase ("Uploading…" vs "Extracting…") so a stuck upload and
 * a stuck extraction aren't indistinguishable to the person watching it.
 */
export function LoadingScreen({ message = "Extracting…" }: LoadingScreenProps) {
  return (
    <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-surface-white px-4">
      <Image
        src="/illustrations/processing-exptraction-page-center-logo.svg"
        alt=""
        width={129}
        height={135}
        priority
      />
      <p className="text-center text-[30px] font-bold leading-9 tracking-[-1.2px] text-ink-primary">
        {message}
      </p>
      <p className="text-xl leading-9 tracking-[-1.2px] text-[#464646]/75">This may take a while</p>
    </div>
  );
}
