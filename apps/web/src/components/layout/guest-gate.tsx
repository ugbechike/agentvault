"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { useIsClient } from "@/hooks/use-is-client";

export const GuestGate = ({ children }: { children: React.ReactNode }) => {
  const { state } = useDemoWorkspace();
  const ready = useIsClient();
  const router = useRouter();

  useEffect(() => {
    if (ready && state.session) {
      router.replace("/dashboard");
    }
  }, [ready, router, state.session]);

  if (!ready || state.session) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-sm text-ink-soft">
        Opening the demo workspace…
      </div>
    );
  }

  return children;
};
