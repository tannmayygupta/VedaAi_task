import Image from "next/image";

export type LoadingScreenProps = {
  message?: string;
  /** 0-100. Shown next to the message when provided (e.g. real Blob upload progress). */
  progressPercent?: number;
};

export function LoadingScreen({ message = "Extracting…", progressPercent }: LoadingScreenProps) {
  const hasProgress = typeof progressPercent === "number";

  return (
    <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-surface-white px-4">
      <Image
        src="/illustrations/processing-exptraction-page-center-logo.svg"
        alt=""
        width={129}
        height={135}
        className="size-20 animate-pulse"
        priority
      />
      <p className="text-center text-[30px] font-bold text-ink-primary">
        {message}
        {hasProgress && ` ${Math.round(progressPercent)}%`}
      </p>
      {hasProgress ? (
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-off-white"
        >
          <div
            className="h-full rounded-full bg-brand-orange transition-[width]"
            style={{ width: `${Math.round(progressPercent)}%` }}
          />
        </div>
      ) : (
        <p className="text-xl text-ink-secondary">This may take a while</p>
      )}
    </div>
  );
}
