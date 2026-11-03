"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { attentionStatus, connectedStatus, notConnectedStatus } from "@/components/connectors/labels";
import { ApiStatus } from "@/components/dashboard/api-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useBrowserSession } from "@/hooks/use-browser-session";
import { useProviderConnections } from "@/hooks/use-provider-connections";
import { apiRequest } from "@/modules/api/client";
import { listAgents, type AgentSummary } from "@/modules/agents/agent-api";
import { connectorCatalog, connectableProviders } from "@agentvault/shared";

const providerName = (provider: string): string => connectorCatalog.find((entry) => entry.provider === provider)?.name ?? provider;

export const DashboardView = () => {
  const session = useBrowserSession();
  const { connections, error } = useProviderConnections();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [grantCount, setGrantCount] = useState(0);
  const connected = connections.filter((connection) => connection.status === "connected");
  const activeAgents = agents.filter((agent) => agent.status === "active");

  useEffect(() => {
    void listAgents().then(setAgents).catch(() => setAgents([]));
    void apiRequest<{ permissions: { allowed: boolean }[] }>("/api/permissions")
      .then((body) => setGrantCount(body.permissions.filter((item) => item.allowed).length))
      .catch(() => setGrantCount(0));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title={`Hello, ${session?.name.split(" ")[0] ?? "there"}`}
        description="Connect GitHub with your account, register an agent, then choose what that agent can do."
        actions={
          <>
            <Link href="/connectors/github/connect">
              <Button variant="secondary">Connect GitHub</Button>
            </Link>
            <Link href="/agents/new">
              <Button>Register an agent</Button>
            </Link>
          </>
        }
      />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Connected services", String(connected.length), "Authorized provider accounts"],
          ["Active agents", String(activeAgents.length), "External MCP clients"],
          ["Allowed grants", String(grantCount), "Saved agent permissions"],
          ["Activity", "Live", "Recorded on the activity page"],
        ].map(([label, value, note]) => (
          <Card key={label}>
            <p className="text-sm text-ink-soft">{label}</p>
            <p className="mt-2 font-serif text-4xl">{value}</p>
            <p className="mt-2 text-xs text-ink-soft">{note}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <h2 className="font-serif text-2xl">Recent activity</h2>
          <p className="mt-4 text-sm leading-6 text-ink-soft">Allowed and denied tool calls are stored after an agent uses AgentVault.</p>
          <Link href="/activity" className="mt-4 inline-block text-sm text-copper-deep underline">
            View activity
          </Link>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-2xl">Connection health</h2>
          <ApiStatus />
          {connectableProviders.map((provider) => {
            const match = connections.find((connection) => connection.provider === provider);
            const label = match?.status === "connected" ? connectedStatus : match?.status === "error" ? attentionStatus : notConnectedStatus;
            return (
              <div key={provider} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{providerName(provider)}</p>
                  <p className="text-sm text-ink-soft">{match?.status === "connected" ? match.providerAccountId : label}</p>
                </div>
                <Badge tone={match?.status === "connected" ? "good" : "neutral"}>{label}</Badge>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
};
