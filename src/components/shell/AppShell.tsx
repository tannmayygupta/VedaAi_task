"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileHeader } from "./MobileHeader";
import { MobileNavDrawer } from "./MobileNavDrawer";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] p-3">
      <div className="flex gap-3">
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="hidden lg:block">
            <TopBar />
          </div>
          <div className="lg:hidden">
            <MobileHeader onOpenMenu={() => setMobileMenuOpen(true)} />
          </div>
          {/* Rendered exactly once — only the chrome above swaps responsively,
              never the page content, so effects/fetches in `children` never
              double-mount. */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <MobileNavDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
