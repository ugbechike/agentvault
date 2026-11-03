"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { connectedStatus, notConnectedStatus } from "@/components/connectors/labels";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useProviderConnections } from "@/hooks/use-provider-connections";
import { apiRequest } from "@/modules/api/client";
import { listAgents, type AgentSummary } from "@/modules/agents/agent-api";
import { connectableProviders, type ProviderId } from "@agentvault/shared";

const providerLabel: Record<ProviderId, string> = { demo: "Demo MCP Provider", github: "GitHub", supabase: "Supabase" };

export const PermissionBoard = () => {
  const { connections, error } = useProviderConnections();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [permissions, setPermissions] = useState<{ agentId: string; connectionId: string; capability: string; allowed: boolean }[]>([]);

  useEffect(() => {
    void listAgents().then(setAgents).catch(() => setAgents([]));
    void apiRequest<{ permissions: { agentId: string; connectionId: string; capability: string; allowed: boolean }[] }>("/api/permissions")
      .then((body) => setPermissions(body.permissions))
      .catch(() => setPermissions([]));
  }, []);

  const labelFor = (agentId: string, provider: ProviderId): string => {
    const connection = connections.find((item) => item.provider === provider);
    if (!connection) return "No access";
    const mine = permissions.filter((item) => item.agentId === agentId && item.connectionId === connection.id && item.allowed);
    if (mine.some((item) => item.capability.endsWith(".write"))) return "Read and write";
    if (mine.some((item) => item.capability.endsWith(".read"))) return "Read only";
    return "No access";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Policy"
        title="Permissions"
        description="Saved access for each agent. Open an agent to change it. Revocation applies on the next tool call."
      />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      {agents.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">No agents yet.</p>
          <Link href="/agents/new" className="mt-3 inline-block text-sm text-copper-deep underline">
            Register an agent
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl">{agent.name}</h2>
                  <p className="text-sm text-ink-soft">{agent.status === "active" ? "Active" : "Revoked"}</p>
                </div>
                <Link href={`/agents/${agent.id}`} className="text-sm text-copper-deep underline">
                  Configure access
                </Link>
              </div>
              <ul className="divide-y divide-line">
                {connectableProviders.map((provider) => {
                  const connected = connections.some((item) => item.provider === provider && item.status === "connected");
                  return (
                    <li key={provider} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <span className="font-medium">{providerLabel[provider]}</span>
                      <span className="text-ink-soft">{labelFor(agent.id, provider)}</span>
                      <Badge tone={connected ? "good" : "neutral"}>{connected ? connectedStatus : notConnectedStatus}</Badge>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
