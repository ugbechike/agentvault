import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export const Alert = ({
  tone = "warn",
  children,
}: {
  tone?: "warn" | "bad" | "good" | "neutral";
  children: ReactNode;
}) => (
  <div
    role={tone === "bad" ? "alert" : "status"}
    className={cn(
      "rounded-2xl px-4 py-3 text-sm leading-6",
      tone === "bad" && "bg-clay-soft text-clay",
      tone === "good" && "bg-pine-soft text-pine",
      tone === "warn" && "bg-gold-soft text-gold",
      tone === "neutral" && "bg-ink/5 text-ink-soft",
    )}
  >
    {children}
  </div>
);
