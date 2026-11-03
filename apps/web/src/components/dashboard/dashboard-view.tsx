"use client";

import Link from "next/link";

import { ApiStatus } from "@/components/dashboard/api-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { formatTimestamp } from "@/lib/format";
import { summarizeWorkspace } from "@/modules/dashboard/summary";

export const DashboardView = () => {
  const { state } = useDemoWorkspace();
  const summary = summarizeWorkspace(state);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title={`Hello, ${state.session?.name.split(" ")[0] ?? "there"}`}
        description="A sample brokerage workspace. Connection health below mixes a live API check with browser fixtures."
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Connected services", String(summary.connectedCount), "Simulated status"],
          ["Active agents", String(summary.agentCount), "Browser records"],
          ["Allowed grants", String(summary.allowedGrants), "Not enforced"],
          ["Recent samples", String(summary.recent.length), "Not MCP traffic"],
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
          <h2 className="font-serif text-2xl">Recent tool activity</h2>
          <ul className="mt-4 divide-y divide-line">
            {summary.recent.map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{event.toolName}</p>
                  <p className="text-sm text-ink-soft">
                    {event.agentName} · {event.provider} · {formatTimestamp(event.timestamp)}
                  </p>
                </div>
                <Badge tone={event.status === "success" ? "good" : event.status === "denied" ? "warn" : "bad"}>
                  {event.status}
                </Badge>
              </li>
            ))}
          </ul>
          <Link href="/activity" className="mt-2 inline-block text-sm text-copper-deep underline">
            View the sample log
          </Link>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-2xl">Connection health</h2>
          <ApiStatus />
          {state.connections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium capitalize">{connection.provider}</p>
                <p className="text-sm text-ink-soft">
                  {connection.status === "connected" ? connection.accountLabel : "Not connected"} · simulated
                </p>
              </div>
              <Badge tone={connection.status === "connected" ? "good" : "neutral"}>{connection.status}</Badge>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Downstream MCP</p>
              <p className="text-sm text-ink-soft">Endpoint returns 501</p>
            </div>
            <Badge tone="warn">Not implemented</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
