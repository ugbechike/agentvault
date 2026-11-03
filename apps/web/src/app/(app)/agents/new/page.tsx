import type { Metadata } from "next";

import { RegisterAgentForm } from "@/components/agents/agent-views";

export const metadata: Metadata = { title: "Register agent" };

const NewAgentPage = async ({ searchParams }: { searchParams: Promise<{ preset?: string }> }) => {
  const { preset } = await searchParams;
  return <RegisterAgentForm preset={preset === "inspector" ? "inspector" : undefined} />;
};

export default NewAgentPage;
