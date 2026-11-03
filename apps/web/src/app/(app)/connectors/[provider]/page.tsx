import { connectorCatalog } from "@agentvault/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConnectorDetail } from "@/components/connectors/connector-detail";

export const metadata: Metadata = { title: "Connector" };

const ConnectorPage = async ({ params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  if (!connectorCatalog.some((entry) => entry.provider === provider)) {
    notFound();
  }
  return <ConnectorDetail provider={provider} />;
};

export default ConnectorPage;
