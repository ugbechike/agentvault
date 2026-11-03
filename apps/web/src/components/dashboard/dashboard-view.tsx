"use client";

import Link from "next/link";

import { notConnectedStatus, testConnectionStatus } from "@/components/connectors/labels";
import { ApiStatus } from "@/components/dashboard/api-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { useProviderConnections } from "@/hooks/use-provider-connections";
import { connectorCatalog, connectableProviders } from "@agentvault/shared";

const providerName = (provider: string): string =>
  connectorCatalog.find((entry) => entry.provider === provider)?.name ?? provider;

export const DashboardView = () => {
  const { state } = useDemoWorkspace();
  const { connections, error } = useProviderConnections();
  const connected = connections.filter((connection) => connection.status === "connected");
  const activeAgents = state.agents.filter((agent) => agent.status === "active");
  const allowedGrants = state.permissions.filter((permission) => permission.allowed);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title={`Hello, ${state.session?.name.split(" ")[0] ?? "there"}`}
        description="Connect a service, then choose which agents can use it."
        actions={
          <>
            <Link href="/connectors/supabase/connect">
              <Button variant="secondary">Connect Supabase</Button>
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
          ["Connected services", String(connected.length), "Ready for agents you allow"],
          ["Active agents", String(activeAgents.length), "Can use connections you allow"],
          ["Allowed grants", String(allowedGrants.length), "Access choices for your agents"],
          ["Recent activity", "0", "No activity yet"],
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
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            When agents use a connection, their activity will show up here.
          </p>
          <Link href="/activity" className="mt-4 inline-block text-sm text-copper-deep underline">
            View activity
          </Link>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-2xl">Connection health</h2>
          <p className="text-sm text-ink-soft">
            GitHub and Supabase use a test credential configured for this workspace. Open an agent to choose who can use
            each one.
          </p>
          <ApiStatus />
          {connectableProviders.map((provider) => {
            const match = connections.find((connection) => connection.provider === provider);
            const isConnected = match?.status === "connected";
            return (
              <div key={provider} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{providerName(provider)}</p>
                  <p className="text-sm text-ink-soft">
                    {isConnected ? match?.providerAccountId || "Workspace test credential" : notConnectedStatus}
                  </p>
                </div>
                <Badge tone={isConnected ? "copper" : "neutral"}>{isConnected ? testConnectionStatus : notConnectedStatus}</Badge>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
};
