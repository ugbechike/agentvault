import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "neutral" | "good" | "warn" | "bad" | "copper";

const tones: Record<Tone, string> = {
  neutral: "bg-ink/5 text-ink-soft",
  good: "bg-pine-soft text-pine",
  warn: "bg-gold-soft text-gold",
  bad: "bg-clay-soft text-clay",
  copper: "bg-copper/10 text-copper-deep",
};

export const Badge = ({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) => (
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>
    {children}
  </span>
);
