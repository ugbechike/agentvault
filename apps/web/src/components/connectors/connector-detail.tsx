"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ToolList } from "@/components/connectors/tool-list";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useProviderConnections } from "@/hooks/use-provider-connections";
import { formatTimestamp } from "@/lib/format";
import {
  disconnectProviderConnection,
  discoverProviderTools,
  loadConnectionTools,
  type DiscoveredConnectionTool,
} from "@/modules/connectors/connection-api";
import { capabilityCatalog, connectorCatalog, type ProviderId } from "@agentvault/shared";

export const ConnectorDetail = ({ provider }: { provider: string }) => {
  const entry = connectorCatalog.find((item) => item.provider === provider);
  const { connections, error, reload } = useProviderConnections();
  const [tools, setTools] = useState<DiscoveredConnectionTool[]>([]);
  const [actionError, setActionError] = useState<string>();
  const [pending, setPending] = useState(false);

  if (!entry) {
    return <Alert tone="bad">Unknown connector.</Alert>;
  }

  if (entry.status !== "available") {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Connector" title={entry.name} description={entry.description} />
        <Alert tone="warn">No adapter exists for {entry.name}. The marketplace keeps the slot for a later provider.</Alert>
      </div>
    );
  }

  const typedProvider = provider as ProviderId;
  const connection = connections.find((item) => item.provider === typedProvider && item.status === "connected");
  const connected = Boolean(connection);
  const capabilities = capabilityCatalog.filter((item) => item.provider === typedProvider);

  useEffect(() => {
    if (!connection) {
      setTools([]);
      return;
    }
    void loadConnectionTools(connection.id)
      .then(setTools)
      .catch((cause: unknown) => {
        setActionError(cause instanceof Error ? cause.message : "Tools could not be loaded.");
      });
  }, [connection]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Connector"
        title={entry.name}
        description={entry.authModel}
        actions={
          <Link href={`/connectors/${provider}/connect`}>
            <Button>{connected ? "Connect again" : "Connect"}</Button>
          </Link>
        }
      />
      {error ? <Alert tone="bad">{error}</Alert> : null}
      {actionError ? <Alert tone="bad">{actionError}</Alert> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Connection</h2>
            <Badge tone={connected ? "good" : "neutral"}>{connected ? "Connected" : "Not connected"}</Badge>
          </div>
          <p className="text-sm text-ink-soft">Project: {connection?.providerAccountId ?? "Not used"}</p>
          <p className="text-sm text-ink-soft">
            Updated: {connection?.updatedAt ? formatTimestamp(connection.updatedAt) : "Never"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={!connection || pending}
              onClick={() => {
                if (!connection) return;
                setPending(true);
                setActionError(undefined);
                void discoverProviderTools(connection.id)
                  .then(() => loadConnectionTools(connection.id))
                  .then(setTools)
                  .catch((cause: unknown) => {
                    setActionError(cause instanceof Error ? cause.message : "Tool discovery failed.");
                  })
                  .finally(() => setPending(false));
              }}
            >
              {pending ? "Discovering…" : "Discover tools"}
            </Button>
            <Button
              variant="danger"
              disabled={!connection || pending}
              onClick={() => {
                if (!connection) return;
                setPending(true);
                setActionError(undefined);
                void disconnectProviderConnection(connection.id)
                  .then(() => reload())
                  .catch((cause: unknown) => {
                    setActionError(cause instanceof Error ? cause.message : "The connection could not be removed.");
                  })
                  .finally(() => setPending(false));
              }}
            >
              Disconnect
            </Button>
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Provider permissions</h2>
          <ul className="mt-4 space-y-3">
            {capabilities.map((capability) => (
              <li key={capability.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{capability.label}</p>
                  <p className="text-sm text-ink-soft">{capability.description}</p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs">{capability.id}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <h2 className="font-serif text-2xl">Discovered tools</h2>
        <p className="mt-2 mb-4 text-sm text-ink-soft">
          Tools appear here after discovery runs against the saved connection.
        </p>
        <ToolList
          discovered
          tools={tools.map((tool) => ({
            id: tool.id,
            agentvaultName: tool.upstreamToolName,
            upstreamName: tool.upstreamToolName,
            description: tool.description,
            inputSchema: tool.inputSchema,
            requiredCapability: tool.requiredCapability,
          }))}
          empty={connected ? "No tools discovered yet." : "Connect this provider before discovering tools."}
        />
      </Card>
    </div>
  );
};
