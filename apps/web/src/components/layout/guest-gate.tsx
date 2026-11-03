"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useBrowserSession } from "@/hooks/use-browser-session";
import { useIsClient } from "@/hooks/use-is-client";

export const GuestGate = ({ children }: { children: React.ReactNode }) => {
  const session = useBrowserSession();
  const ready = useIsClient();
  const router = useRouter();

  useEffect(() => {
    if (ready && session) router.replace("/dashboard");
  }, [ready, router, session]);

  if (!ready || session) {
    return <div className="grid min-h-screen place-items-center bg-paper text-sm text-ink-soft">Opening AgentVault…</div>;
  }

  return children;
};
