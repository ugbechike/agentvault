import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { SessionGate } from "@/components/layout/session-gate";

const AppLayout = ({ children }: { children: ReactNode }) => (
  <SessionGate>
    <AppShell>{children}</AppShell>
  </SessionGate>
);

export default AppLayout;
