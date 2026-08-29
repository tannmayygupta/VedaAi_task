import Image from "next/image";
import { ChevronsRight, PanelLeft } from "lucide-react";

type NavItem = { label: string; iconSrc: string; active?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", iconSrc: "/illustrations/home-logo.svg" },
  { label: "My Classroom", iconSrc: "/illustrations/my-classroom-logo.svg" },
  { label: "Assignments", iconSrc: "/illustrations/assigment-logo.svg" },
  { label: "Exams", iconSrc: "/illustrations/exams-logo.svg", active: true },
  { label: "My Library", iconSrc: "/illustrations/my-library-logo.svg" },
];

export type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

/**
 * Figma's "Loading state" frame shows a collapsed, icon-only sidebar rail —
 * previously the toggle button was rendered but wired to nothing (see
 * docs/DECISIONS.md, design-fidelity audit). Collapse works from any screen,
 * not just the loading one: a toggle that only works on one page would be a
 * worse, more confusing result than the original inert button.
 */
function CollapsedSidebar({ onToggleCollapse }: { onToggleCollapse: () => void }) {
  return (
    <aside className="flex h-full w-16 shrink-0 flex-col items-center justify-between overflow-y-auto rounded-lg bg-surface-white py-6 shadow-realistic">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/illustrations/veda-ai-logo.svg"
          alt="VedaAI"
          width={40}
          height={40}
          className="size-10 shrink-0"
        />

        <div className="flex size-10 items-center justify-center rounded-full border-4 border-brand-orange/70 bg-[#272727] shadow-realistic">
          <Image
            src="/illustrations/ai-teachers-toolkit-logo.svg"
            alt="AI Teacher's Toolkit"
            width={16}
            height={15}
            className="shrink-0"
          />
        </div>

        <nav className="flex flex-col items-center gap-2">
          {NAV_ITEMS.map(({ label, iconSrc, active }) => (
            <div
              key={label}
              title={label}
              className={`flex size-9 items-center justify-center rounded-sm ${
                active ? "bg-surface-off-white-20" : ""
              }`}
            >
              <Image src={iconSrc} alt={label} width={20} height={20} className="size-5 shrink-0" />
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div title="Settings" className="flex size-9 items-center justify-center rounded-sm">
          <Image src="/illustrations/setting.svg" alt="Settings" width={20} height={20} className="size-5 shrink-0" />
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand sidebar"
          className="flex size-9 items-center justify-center text-ink-secondary/80"
        >
          <ChevronsRight className="size-5" />
        </button>
      </div>
    </aside>
  );
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  if (collapsed) {
    return <CollapsedSidebar onToggleCollapse={onToggleCollapse} />;
  }

  return (
    <aside className="flex h-full w-[304px] shrink-0 flex-col items-center justify-between overflow-y-auto rounded-lg bg-surface-white p-6 shadow-realistic">
      <div className="flex flex-col items-center gap-14">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/illustrations/veda-ai-logo.svg"
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0"
            />
            <span className="text-[28px] font-bold tracking-[-0.06em] text-ink-primary">
              VedaAI
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="flex size-5 items-center justify-center"
          >
            <PanelLeft className="size-5 text-ink-secondary/80" />
          </button>
        </div>

        <div className="flex w-[251px] items-center justify-center">
          <div className="flex h-[42px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-4 border-brand-orange/70 bg-[#272727] px-6 py-2 text-ink-inverse shadow-realistic">
            <Image
              src="/illustrations/ai-teachers-toolkit-logo.svg"
              alt=""
              width={16}
              height={15}
              className="shrink-0"
            />
            <span className="text-sm font-medium">AI Teacher&apos;s Toolkit</span>
          </div>
        </div>

        <nav className="flex w-[251px] flex-col items-start gap-2">
          {NAV_ITEMS.map(({ label, iconSrc, active }) => (
            <div
              key={label}
              className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 ${
                active ? "bg-surface-off-white-20" : ""
              }`}
            >
              <Image src={iconSrc} alt="" width={20} height={20} className="size-5 shrink-0" />
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
          <Image src="/illustrations/setting.svg" alt="" width={20} height={20} className="size-5 shrink-0" />
          <span className="flex-1 text-base text-ink-secondary/80">Settings</span>
        </div>
        <div className="flex w-[256px] flex-col items-start rounded-lg bg-surface-off-white-20 p-3">
          <div className="flex w-full items-center gap-2">
            <Image
              src="/illustrations/delhi-public-school-logo.svg"
              alt=""
              width={59}
              height={60}
              className="size-[59px] shrink-0 rounded-full object-cover"
            />
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
