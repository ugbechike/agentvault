import type { Metadata } from "next";

import { AgentDetailView } from "@/components/agents/agent-views";

export const metadata: Metadata = { title: "Agent" };

const AgentPage = async ({ params }: { params: Promise<{ agentId: string }> }) => {
  const { agentId } = await params;
  return <AgentDetailView agentId={agentId} />;
};

export default AgentPage;
