"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileHeader } from "./MobileHeader";
import { MobileNavDrawer } from "./MobileNavDrawer";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] p-3">
      <div className="flex h-full gap-3">
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-3">
          <div className="hidden lg:block">
            <TopBar />
          </div>
          <div className="lg:hidden">
            <MobileHeader onOpenMenu={() => setMobileMenuOpen(true)} />
          </div>
          {/* Rendered exactly once — only the chrome above swaps responsively,
              never the page content, so effects/fetches in `children` never
              double-mount. min-h-0 lets it actually shrink to the remaining
              space instead of growing to fit its tallest descendant (see
              docs/DECISIONS.md — mapping screen page-fit fix). */}
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <MobileNavDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
