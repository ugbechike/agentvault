import { connectorCatalog } from "@agentvault/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConnectorDetail } from "@/components/connectors/connector-detail";

export const metadata: Metadata = { title: "Connector" };

const ConnectorPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ provider: string }>;
  searchParams: Promise<{ oauth?: string }>;
}) => {
  const { provider } = await params;
  const query = await searchParams;
  if (!connectorCatalog.some((entry) => entry.provider === provider)) {
    notFound();
  }
  return <ConnectorDetail provider={provider} oauth={query.oauth} />;
};

export default ConnectorPage;
