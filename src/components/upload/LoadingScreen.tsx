import { Sparkles } from "lucide-react";

export type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = "Extracting…" }: LoadingScreenProps) {
  return (
    <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-surface-white">
      <Sparkles className="size-20 animate-pulse text-brand-orange" />
      <p className="text-[30px] font-bold text-ink-primary">{message}</p>
      <p className="text-xl text-ink-secondary">This may take a while</p>
    </div>
  );
}
