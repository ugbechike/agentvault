"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { apiBaseUrl } from "@/lib/format";
import { listAgents, type AgentSummary } from "@/modules/agents/agent-api";
import { claudeCodeConfig, cursorConfig } from "@/modules/mcp/instructions";

const ConfigBlock = ({ title, value }: { title: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        <Button
          variant="secondary"
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="mt-4 overflow-auto rounded-2xl bg-ink px-4 py-4 text-xs leading-5 text-paper">{value}</pre>
    </Card>
  );
};

export const McpAccess = () => {
  const url = `${apiBaseUrl()}/mcp`;
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void listAgents()
      .then(setAgents)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Agents could not be loaded."));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Downstream"
        title="MCP access"
        description="Point Cursor or Claude Code at this AgentVault endpoint. Use the credential issued for one agent, not a provider token."
      />
      {error ? <Alert tone="bad">{error}</Alert> : null}
      <Alert tone="warn">
        Credentials are shown once when you register or rotate an agent. The examples below use a placeholder until you paste that credential.
      </Alert>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs tracking-wide text-ink-soft uppercase">MCP endpoint</p>
          <p className="mt-2 font-mono text-sm break-all">{url}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Streamable HTTP</Badge>
            <Badge tone="good">Bearer credential</Badge>
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">How to connect</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-soft">
            <li>Register an agent and copy the credential from that page.</li>
            <li>Replace the placeholder in the client config.</li>
            <li>Grant GitHub access on the agent before calling a tool.</li>
            <li>The client lists only the tools that agent is allowed to use. Every call is checked again.</li>
          </ol>
        </Card>
      </div>
      <Card>
        <h2 className="font-serif text-2xl">Registered agents</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {agents.length === 0 ? <li className="text-ink-soft">No agents yet.</li> : null}
          {agents.map((agent) => (
            <li key={agent.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{agent.name}</span>
              <span className="text-ink-soft">{agent.status}</span>
              <span className="font-mono text-xs">{agent.credentials[0] ? `${agent.credentials[0].tokenPrefix}…` : "No active credential"}</span>
            </li>
          ))}
        </ul>
      </Card>
      <ConfigBlock title="Cursor" value={cursorConfig(url)} />
      <ConfigBlock title="Claude Code" value={claudeCodeConfig(url)} />
    </div>
  );
};
