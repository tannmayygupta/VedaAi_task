import type { ComponentType } from "react";
import {
  LayoutGrid,
  GraduationCap,
  FileText,
  ClipboardList,
  Library,
  Settings,
  Sparkles,
  PanelLeft,
} from "lucide-react";

type NavItem = { label: string; icon: ComponentType<{ className?: string }>; active?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: LayoutGrid },
  { label: "My Classroom", icon: GraduationCap },
  { label: "Assignments", icon: FileText },
  { label: "Exams", icon: ClipboardList, active: true },
  { label: "My Library", icon: Library },
];

export function Sidebar() {
  return (
    <aside className="flex h-[763px] w-[304px] shrink-0 flex-col items-center justify-between rounded-lg bg-surface-white p-6 shadow-realistic">
      <div className="flex flex-col items-center gap-14">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-sm bg-surface-dark-grey text-ink-inverse">
              <Sparkles className="size-5" />
            </div>
            <span className="text-[28px] font-bold tracking-[-0.06em] text-ink-primary">
              VedaAI
            </span>
          </div>
          <button type="button" aria-label="Toggle sidebar" className="flex size-5 items-center justify-center">
            <PanelLeft className="size-5 text-ink-secondary/80" />
          </button>
        </div>

        <div className="flex w-[251px] items-center justify-center">
          <div className="flex h-[42px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-4 border-brand-orange/70 bg-[#272727] px-6 py-2 text-ink-inverse shadow-realistic">
            <Sparkles className="size-4 shrink-0" />
            <span className="text-sm font-medium">AI Teacher&apos;s Toolkit</span>
          </div>
        </div>

        <nav className="flex w-[251px] flex-col items-start gap-2">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`flex w-[254px] items-center gap-2 rounded-sm px-3 py-2 ${
                active ? "bg-surface-off-white-20" : ""
              }`}
            >
              <Icon className="size-5 text-ink-secondary/80" />
              <span
                className={`flex-1 text-base ${
                  active ? "font-medium text-ink-primary" : "text-ink-secondary/80"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex w-full flex-col items-start gap-2">
        <div className="flex w-full items-center gap-2 px-3 py-2">
          <Settings className="size-5 text-ink-secondary/80" />
          <span className="flex-1 text-base text-ink-secondary/80">Settings</span>
        </div>
        <div className="flex w-[256px] flex-col items-start rounded-lg bg-surface-off-white-20 p-3">
          <div className="flex w-full items-center gap-2">
            <div className="flex size-[59px] shrink-0 items-center justify-center rounded-full bg-surface-off-white">
              <GraduationCap className="size-7 text-ink-secondary" />
            </div>
            <div className="flex flex-1 flex-col items-start">
              <p className="w-full text-base font-bold text-ink-primary">Delhi Public School</p>
              <p className="w-full text-sm text-ink-secondary">Bokaro Steel City</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
