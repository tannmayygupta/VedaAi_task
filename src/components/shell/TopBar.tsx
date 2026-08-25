import { ArrowLeft, ClipboardList, CircleHelp, Bell, Sparkles, ChevronDown } from "lucide-react";

export function TopBar({ breadcrumb = "Exams", userName = "Madhur Rastogi" }: { breadcrumb?: string; userName?: string }) {
  return (
    <header className="flex h-14 w-full items-center gap-2.5 rounded-lg bg-surface-white/75 py-2 pl-6 pr-2">
      <button
        type="button"
        aria-label="Back"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-white"
      >
        <ArrowLeft className="size-6 text-ink-primary" />
      </button>

      <div className="flex flex-1 items-center gap-2">
        <ClipboardList className="size-5 text-surface-disabled" />
        <span className="text-base font-semibold text-surface-disabled">{breadcrumb}</span>
      </div>

      <button
        type="button"
        aria-label="Help"
        className="flex size-9 items-center justify-center rounded-full bg-surface-off-white"
      >
        <CircleHelp className="size-5 text-ink-primary" />
      </button>
      <button
        type="button"
        aria-label="Notifications"
        className="flex size-9 items-center justify-center rounded-full bg-surface-off-white"
      >
        <Bell className="size-5 text-ink-primary" />
      </button>
      <button
        type="button"
        aria-label="AI"
        className="flex size-9 items-center justify-center rounded-full bg-surface-off-white"
      >
        <Sparkles className="size-5 text-brand-orange" />
      </button>

      <div className="flex items-center gap-2 rounded-md px-3 py-1.5">
        <div className="size-8 rounded-full bg-surface-off-white" />
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold text-ink-primary">{userName}</span>
          <ChevronDown className="size-4 text-ink-secondary" />
        </div>
      </div>
    </header>
  );
}
