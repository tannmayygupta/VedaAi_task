import Image from "next/image";

export type LoadingScreenProps = {
  message?: string;
};

/**
 * Matches the Figma "Loading state" frame (desktop node 1:9305's mobile
 * counterpart) for layout/typography, with one deliberate deviation: the icon
 * pulses (Tailwind's `animate-pulse`) even though Figma's Effects panel on
 * that layer is empty. Re-added at the user's explicit request as a "still
 * processing" cue — see docs/DECISIONS.md. Used for both the upload-to-Blob
 * phase and the AI-extraction phase — Figma defines only one generic loading
 * state visually; callers pass a distinct `message` per phase ("Uploading…"
 * vs "Extracting…") so a stuck upload and a stuck extraction aren't
 * indistinguishable to the person watching it.
 */
export function LoadingScreen({ message = "Extracting…" }: LoadingScreenProps) {
  return (
    <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-surface-white px-4">
      <Image
        src="/illustrations/processing-exptraction-page-center-logo.svg"
        alt=""
        width={129}
        height={135}
        className="animate-pulse"
        priority
      />
      <p className="bg-[linear-gradient(to_right,#303030_0%,#606060_40%,#808080_50%,#606060_60%,#303030_100%)] bg-clip-text text-center text-[30px] font-bold leading-9 tracking-[-1.2px] text-transparent">
        {message}
      </p>
      <p className="text-xl leading-9 tracking-[-1.2px] text-[#464646]/75">This may take a while</p>
    </div>
  );
}
