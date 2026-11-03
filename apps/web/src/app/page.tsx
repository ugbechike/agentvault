"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useBrowserSession } from "@/hooks/use-browser-session";
import { useIsClient } from "@/hooks/use-is-client";

const HomePage = () => {
  const session = useBrowserSession();
  const ready = useIsClient();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(session ? "/dashboard" : "/sign-in");
  }, [ready, router, session]);

  return <div className="grid min-h-screen place-items-center bg-paper text-sm text-ink-soft">Opening AgentVault…</div>;
};

export default HomePage;
