"use client";

import Link from "next/link";

import { notConnectedStatus, testConnectionStatus } from "@/components/connectors/labels";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { useProviderConnections } from "@/hooks/use-provider-connections";
import { connectableProviders, type ProviderId } from "@agentvault/shared";

const providerLabel: Record<ProviderId, string> = {
  github: "GitHub",
  supabase: "Supabase",
};

const presetLabel = (
  permissions: { agentId: string; capability: string; allowed: boolean }[],
  agentId: string,
  provider: ProviderId,
): string => {
  const write = permissions.some((item) => item.agentId === agentId && item.capability === `${provider}.write` && item.allowed);
  const read = permissions.some((item) => item.agentId === agentId && item.capability === `${provider}.read` && item.allowed);
  if (write) return "Read and write";
  if (read) return "Read only";
  return "No access";
};

export const PermissionBoard = () => {
  const { state } = useDemoWorkspace();
  const { connections, error } = useProviderConnections();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Policy"
        title="Permissions"
        description="See which agents can use each connection, and open an agent to change that access. Access choices here are a preview for this workspace."
      />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      {state.agents.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">No agents yet.</p>
          <Link href="/agents/new" className="mt-3 inline-block text-sm text-copper-deep underline">
            Register an agent
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.agents.map((agent) => (
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
                  const connected = connections.some(
                    (item) => item.provider === provider && item.status === "connected",
                  );
                  return (
                    <li key={provider} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <span className="font-medium">{providerLabel[provider]}</span>
                      <span className="text-ink-soft">{presetLabel(state.permissions, agent.id, provider)}</span>
                      <Badge tone={connected ? "copper" : "neutral"}>{connected ? testConnectionStatus : notConnectedStatus}</Badge>
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
