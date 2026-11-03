"use client";

import { connectorCatalog } from "@agentvault/shared";

import { ConnectorCard } from "@/components/connectors/connector-card";
import { PageHeader } from "@/components/ui/page-header";
import { useProviderConnections } from "@/hooks/use-provider-connections";

export const MarketplaceView = () => {
  const { connections, error } = useProviderConnections();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Marketplace"
        title="Connectors"
        description="GitHub and Supabase have adapter skeletons. Gmail, Drive, and Notion are listed so the catalog can grow without sharing one auth flow."
      />
      {error ? <p className="text-sm text-ink-soft">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {connectorCatalog.map((entry) => (
          <ConnectorCard
            key={entry.provider}
            entry={entry}
            connected={
              connections.some((connection) => connection.provider === entry.provider && connection.status === "connected")
            }
          />
        ))}
      </div>
    </div>
  );
};
