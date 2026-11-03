"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { illustrativeAllowlist } from "@agentvault/shared";
import { claudeCodeConfig, cursorConfig, placeholderMcpUrl } from "@/modules/mcp/instructions";

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
  const url = placeholderMcpUrl();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Downstream"
        title="MCP access"
        description="Point a future MCP client at AgentVault. The URL below is the intended endpoint, and today it answers HTTP 501."
      />
      <Alert tone="warn">
        No consumer credential has been issued. The configuration examples use a placeholder, not a working token.
      </Alert>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs tracking-wide text-ink-soft uppercase">Placeholder endpoint</p>
          <p className="mt-2 font-mono text-sm break-all">{url}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Streamable HTTP</Badge>
            <Badge tone="warn">Not implemented</Badge>
            <Badge tone="bad">Auth not configured</Badge>
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">How a client should connect</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-soft">
            <li>Register the agent in AgentVault and leave its grants empty until you choose them.</li>
            <li>Use Streamable HTTP against the AgentVault URL, not the provider URL.</li>
            <li>Send the future MCP consumer credential. Do not paste a GitHub or Supabase token here.</li>
            <li>Expect tools/list to advertise only the allowlist for that agent, once it exists.</li>
          </ol>
        </Card>
      </div>
      <ConfigBlock title="Cursor" value={cursorConfig(url)} />
      <ConfigBlock title="Claude Code" value={claudeCodeConfig(url)} />
      <Card>
        <h2 className="font-serif text-2xl">Allowlist names</h2>
        <p className="mt-2 text-sm text-ink-soft">
          These identifiers are the ones AgentVault may expose later. They are not a live tools/list, and they may not match upstream names.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {illustrativeAllowlist.map((tool) => (
            <li key={tool.agentvaultName} className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{tool.agentvaultName}</span>
              <span className="text-ink-soft">{tool.requiredCapability}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
