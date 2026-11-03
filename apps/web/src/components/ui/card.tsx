import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cn("rounded-3xl border border-line bg-paper-2 p-5 shadow-card", className)}>
    {children}
  </section>
);
