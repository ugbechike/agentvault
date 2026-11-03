"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { attentionStatus, connectLabel, connectedStatus, disconnectLabel, notConnectedStatus } from "@/components/connectors/labels";
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

const statusLabel = (status: string | undefined): string => {
  if (status === "connected") return connectedStatus;
  if (status === "error" || status === "pending") return attentionStatus;
  return notConnectedStatus;
};

export const ConnectorDetail = ({ provider, oauth }: { provider: string; oauth?: string }) => {
  const entry = connectorCatalog.find((item) => item.provider === provider);
  const { connections, error, reload } = useProviderConnections();
  const typedProvider = provider as ProviderId;
  const connection = connections.find((item) => item.provider === typedProvider);
  const [tools, setTools] = useState<DiscoveredConnectionTool[]>([]);
  const [actionError, setActionError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!connection?.id) return;
    let cancelled = false;
    void loadConnectionTools(connection.id)
      .then((next) => {
        if (!cancelled) setTools(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setActionError(cause instanceof Error ? cause.message : "Tools could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [connection?.id]);

  if (!entry) return <Alert tone="bad">Unknown connector.</Alert>;

  if (entry.status !== "available") {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Connector" title={entry.name} description={entry.authModel} />
        <Alert tone="warn">{entry.name} is on the way. You will connect it here and choose which agents can use it.</Alert>
      </div>
    );
  }

  const connected = connection?.status === "connected";
  const capabilities = capabilityCatalog.filter((item) => item.provider === typedProvider);
  const visibleTools = connection ? tools : [];
  const exposed = visibleTools.filter((tool) => tool.enabled);
  const hidden = visibleTools.filter((tool) => !tool.enabled);

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
      {oauth === "connected" ? <Alert tone="good">GitHub authorization finished. Capabilities below come from the remote MCP server.</Alert> : null}
      {oauth === "error" ? <Alert tone="bad">GitHub authorization did not finish. The connection is not marked successful.</Alert> : null}
      {error ? <Alert tone="bad">{error}</Alert> : null}
      {actionError ? <Alert tone="bad">{actionError}</Alert> : null}
      {connection?.statusDetail ? <Alert tone={connected ? "neutral" : "warn"}>{connection.statusDetail}</Alert> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Connection</h2>
            <Badge tone={connected ? "good" : connection ? "warn" : "neutral"}>{statusLabel(connection?.status)}</Badge>
          </div>
          <p className="text-sm leading-6 text-ink-soft">
            {connected
              ? `Signed in to ${entry.name} as ${connection?.providerAccountId ?? "your account"}. Choose which agents can use it.`
              : `Connect ${entry.name} with your own account, then choose which agents can use it.`}
          </p>
          <p className="text-sm text-ink-soft">Updated: {connection?.updatedAt ? formatTimestamp(connection.updatedAt) : "Never"}</p>
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
                  .then(() => reload())
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
        <h2 className="font-serif text-2xl">Available capabilities</h2>
        <p className="mt-2 mb-4 text-sm text-ink-soft">These are the allowlisted actions discovered from the provider. Other discovered tools stay hidden.</p>
        <ToolList
          tools={exposed.map((tool) => ({
            id: tool.id,
            name: tool.upstreamToolName,
            description: tool.description,
            requiredCapability: tool.requiredCapability,
          }))}
          empty={connected ? "No allowlisted actions were in the latest discovery." : `Connect ${entry.name} to discover actions.`}
        />
        {hidden.length > 0 ? (
          <p className="mt-4 text-sm text-ink-soft">{hidden.length} discovered tools are not exposed.</p>
        ) : null}
      </Card>
    </div>
  );
};
