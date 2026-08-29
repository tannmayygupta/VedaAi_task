"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileHeader } from "./MobileHeader";
import { MobileNavDrawer } from "./MobileNavDrawer";

export type AppShellProps = {
  children: ReactNode;
  /**
   * Figma specifies two distinct page-background gradients, not one: the
   * Upload screen's own frame uses #f5f5f5→#e9e5e5 ("default"), while both
   * the Loading and Mapping frames use a different, slightly darker
   * #eeeeee→#dadada ("muted"). Defaults to "default" since Upload is the
   * app's entry point.
   */
  background?: "default" | "muted";
};

const BACKGROUND_GRADIENTS = {
  default: "from-[#f5f5f5] to-[#e9e5e5]",
  muted: "from-[#eeeeee] to-[#dadada]",
} as const;

export function AppShell({ children, background = "default" }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={`relative h-screen w-full overflow-hidden bg-gradient-to-b p-3 ${BACKGROUND_GRADIENTS[background]}`}
    >
      <div className="flex h-full gap-3">
        <div className="hidden lg:flex">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
          />
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
