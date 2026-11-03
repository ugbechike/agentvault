import type { Metadata } from "next";

import { AgentListView } from "@/components/agents/agent-views";

export const metadata: Metadata = { title: "Agents" };

const AgentsPage = () => <AgentListView />;

export default AgentsPage;
