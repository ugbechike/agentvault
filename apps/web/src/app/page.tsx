"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { useIsClient } from "@/hooks/use-is-client";

const HomePage = () => {
  const { state } = useDemoWorkspace();
  const ready = useIsClient();
  const router = useRouter();

  useEffect(() => {
    if (!ready) {
      return;
    }
    router.replace(state.session ? "/dashboard" : "/sign-in");
  }, [ready, router, state.session]);

  return (
    <div className="grid min-h-screen place-items-center bg-paper text-sm text-ink-soft">
      Opening the demo workspace…
    </div>
  );
};

export default HomePage;
