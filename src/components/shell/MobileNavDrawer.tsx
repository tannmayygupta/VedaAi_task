"use client";

import Image from "next/image";
import { X } from "lucide-react";

type NavItem = { label: string; iconSrc: string; active?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", iconSrc: "/illustrations/home-logo.svg" },
  { label: "My Classroom", iconSrc: "/illustrations/my-classroom-logo.svg" },
  { label: "Assignments", iconSrc: "/illustrations/assigment-logo.svg" },
  { label: "Exams", iconSrc: "/illustrations/exams-logo.svg", active: true },
  { label: "My Library", iconSrc: "/illustrations/my-library-logo.svg" },
];

export type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Slide-out nav drawer for the mobile header's hamburger button — carries
 * the same nav items/branding/school-card content the desktop Sidebar shows
 * persistently. Figma's phone frames don't include an open-drawer state, so
 * this specific presentation (overlay + slide-in panel) is our own
 * reasonable choice for how "the sidebar's contents on mobile" should work,
 * not a pixel-matched Figma state — see docs/DECISIONS.md.
 */
export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <aside className="relative flex h-full w-[280px] flex-col justify-between bg-surface-white p-6 shadow-realistic">
        <div className="flex flex-col gap-10">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/illustrations/veda-ai-logo.svg"
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0"
              />
              <span className="text-2xl font-bold tracking-[-0.06em] text-ink-primary">
                VedaAI
              </span>
            </div>
            <button type="button" aria-label="Close menu" onClick={onClose}>
              <X className="size-5 text-ink-secondary" />
            </button>
          </div>

          <nav className="flex flex-col items-start gap-2">
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
          <div className="flex w-full flex-col items-start rounded-lg bg-surface-off-white-20 p-3">
            <div className="flex w-full items-center gap-2">
              <Image
                src="/illustrations/delhi-public-school-logo.svg"
                alt=""
                width={52}
                height={53}
                className="size-[52px] shrink-0 rounded-full object-cover"
              />
              <div className="flex flex-1 flex-col items-start">
                <p className="w-full text-base font-bold text-ink-primary">Delhi Public School</p>
                <p className="w-full text-sm text-ink-secondary">Bokaro Steel City</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
