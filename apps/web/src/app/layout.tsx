import { DemoProvider } from "@/modules/demo/demo-provider";
import "@/styles/globals.css";

import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import type { ReactNode } from "react";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: {
    default: "AgentVault",
    template: "%s · AgentVault",
  },
  description: "Choose which services your agents can use, and what each agent is allowed to do.",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body className={`${geist.variable} ${fraunces.variable} antialiased`}>
      <DemoProvider>{children}</DemoProvider>
    </body>
  </html>
);

export default RootLayout;
