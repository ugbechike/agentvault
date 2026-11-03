"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useBrowserSession } from "@/hooks/use-browser-session";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const session = useBrowserSession();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto bg-sidebar px-4 py-6 md:flex">
        <SidebarNav />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-ink/50" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[80vw] flex-col overflow-y-auto bg-sidebar px-4 py-6">
            <button
              type="button"
              className="mb-6 grid size-10 place-items-center rounded-full bg-white/10 text-paper"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
      <div className="min-w-0 md:pl-60">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:justify-end">
          <p className="font-serif text-xl md:hidden">AgentVault</p>
          <div className="flex items-center gap-3">
            <span className="max-w-[14rem] truncate text-sm text-ink-soft">{session?.email}</span>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-line md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};
