import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] p-3">
      <div className="flex gap-3">
        <Sidebar />
        <div className="flex flex-1 flex-col gap-3">
          <TopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
