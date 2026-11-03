"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { state } = useDemoWorkspace();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto grid min-h-screen max-w-[1400px] md:grid-cols-[240px_1fr]">
        <aside className="hidden bg-sidebar px-4 py-6 md:block">
          <SidebarNav />
        </aside>
        <div className="min-w-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
            <p className="font-serif text-xl">AgentVault</p>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-line"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
          </div>
          {open ? (
            <div className="fixed inset-0 z-20 bg-sidebar px-4 py-6 md:hidden">
              <button
                type="button"
                className="mb-6 grid size-10 place-items-center rounded-full bg-white/10 text-paper"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          ) : null}
          <div className="flex items-center justify-end px-6 pt-5 text-sm text-ink-soft">
            <span>{state.session?.email}</span>
          </div>
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
