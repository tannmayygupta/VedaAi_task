"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export type MobileHeaderProps = {
  onOpenMenu: () => void;
};

/**
 * Compact header used below the `lg` breakpoint, replacing the desktop
 * Sidebar + TopBar entirely (per Figma's phone frames — e.g. "Upload Screen
 * - Empty State (phone)", node 1:9210): back arrow, wordmark, notifications,
 * avatar, and a hamburger button that opens MobileNavDrawer for the nav
 * items the desktop Sidebar shows persistently.
 */
export function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex h-14 w-full shrink-0 items-center gap-2 rounded-lg bg-surface-white px-3 shadow-realistic">
      <button
        type="button"
        aria-label="Back"
        onClick={() => router.back()}
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
      >
        <Image src="/illustrations/Arrow_Left-hori-nav-logo.svg" alt="" width={20} height={20} className="size-5" />
      </button>

      <span className="flex-1 truncate text-lg font-bold tracking-[-0.04em] text-ink-primary">
        VedaAI
      </span>

      <button
        type="button"
        aria-label="Notifications"
        className="flex size-9 shrink-0 items-center justify-center"
      >
        <Image src="/illustrations/noti-illustration.svg" alt="" width={36} height={36} />
      </button>

      <Image
        src="/illustrations/profile-avatar.svg"
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full object-cover"
      />

      <button
        type="button"
        aria-label="Open menu"
        onClick={onOpenMenu}
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
      >
        <Menu className="size-5 text-ink-primary" />
      </button>
    </header>
  );
}
