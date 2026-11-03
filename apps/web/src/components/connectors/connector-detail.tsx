"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  connectLabel,
  disconnectLabel,
  notConnectedStatus,
  testConnectionStatus,
} from "@/components/connectors/labels";
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

const accessLevel = (capabilityId: string): string => (capabilityId.endsWith(".write") ? "Write" : "Read");

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
        <PageHeader eyebrow="Connector" title={entry.name} description={entry.authModel} />
        <Alert tone="warn">{entry.name} is on the way. You will connect it here and choose which agents can use it.</Alert>
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
          connected ? undefined : (
            <Link href={`/connectors/${provider}/connect`}>
              <Button>{connectLabel(entry.name)}</Button>
            </Link>
          )
        }
      />
      {error ? <Alert tone="bad">{error}</Alert> : null}
      {actionError ? <Alert tone="bad">{actionError}</Alert> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Connection</h2>
            <Badge tone={connected ? "copper" : "neutral"}>{connected ? testConnectionStatus : notConnectedStatus}</Badge>
          </div>
          <p className="text-sm leading-6 text-ink-soft">
            {connected
              ? `Agents can use a ${entry.name} credential already configured for this workspace. Allow access on each agent before they can use it.`
              : `Connect ${entry.name} with the credential already configured for this workspace, then choose which agents can use it.`}
          </p>
          {typedProvider === "supabase" ? (
            <p className="text-sm text-ink-soft">Project: {connection?.providerAccountId ?? "Add a project when you connect"}</p>
          ) : null}
          <p className="text-sm text-ink-soft">
            Updated: {connection?.updatedAt ? formatTimestamp(connection.updatedAt) : "Never"}
          </p>
          <div className="flex flex-wrap gap-2">
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
                    setActionError(cause instanceof Error ? cause.message : "Available actions could not be refreshed.");
                  })
                  .finally(() => setPending(false));
              }}
            >
              {pending ? "Refreshing…" : "Refresh actions"}
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
              {disconnectLabel}
            </Button>
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Access you can grant</h2>
          <p className="mt-2 text-sm text-ink-soft">Grant these on each agent that should use this connection.</p>
          <ul className="mt-4 space-y-3">
            {capabilities.map((capability) => (
              <li key={capability.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{capability.label}</p>
                  <p className="text-sm text-ink-soft">{capability.description}</p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs">{accessLevel(capability.id)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <h2 className="font-serif text-2xl">Available actions</h2>
        <p className="mt-2 mb-4 text-sm text-ink-soft">
          These are the actions agents can take with this connection after you allow access.
        </p>
        <ToolList
          tools={tools.map((tool) => ({
            id: tool.id,
            name: tool.upstreamToolName,
            description: tool.description,
            requiredCapability: tool.requiredCapability,
          }))}
          empty={
            connected
              ? "No actions yet. Refresh to see what agents can do with this connection."
              : `Connect ${entry.name} to see what agents can do with it.`
          }
        />
      </Card>
    </div>
  );
};
