import type { ReactNode } from "react";

import { AuthFrame } from "@/components/layout/auth-frame";
import { GuestGate } from "@/components/layout/guest-gate";

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <GuestGate>
    <AuthFrame>{children}</AuthFrame>
  </GuestGate>
);

export default AuthLayout;
