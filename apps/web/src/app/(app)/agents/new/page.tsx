import type { Metadata } from "next";

import { RegisterAgentForm } from "@/components/agents/agent-views";

export const metadata: Metadata = { title: "Register agent" };

const NewAgentPage = () => <RegisterAgentForm />;

export default NewAgentPage;
