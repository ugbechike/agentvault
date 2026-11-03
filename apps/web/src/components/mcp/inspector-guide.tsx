"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiBaseUrl } from "@/lib/format";

export const InspectorGuide = () => {
  const endpoint = `${apiBaseUrl()}/mcp`;
  const [copied, setCopied] = useState(false);

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl">Test with MCP Inspector</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Use the official Inspector on your own computer. AgentVault does not show a connected status for Inspector, and this page does not send your credential anywhere.
        </p>
      </div>
      <div>
        <p className="text-xs tracking-wide text-ink-soft uppercase">AgentVault MCP endpoint</p>
        <p className="mt-2 font-mono text-sm break-all">{endpoint}</p>
        <p className="mt-2 text-sm text-ink-soft">Transport: Streamable HTTP</p>
      </div>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-soft">
        <li>Install nothing globally. In a terminal, run <span className="font-mono text-ink">npx @modelcontextprotocol/inspector</span>.</li>
        <li>In Inspector, choose Streamable HTTP and paste the endpoint above.</li>
        <li>Copy the credential shown once on this page. In Inspector, set the authorization header to Bearer followed by that credential. Keep it in Inspector on your machine.</li>
        <li>Connect, then list tools. You should see only the actions you allowed for this agent.</li>
        <li>Call <span className="font-mono text-ink">demo_echo</span> with a message such as hello. That call is allowed when Echo is turned on.</li>
        <li>Leave Add turned off, save, then call <span className="font-mono text-ink">demo_add</span> with numbers a and b. AgentVault rejects it before the demo provider is contacted. The provider has no write action, so this is how a denied operation is tested.</li>
        <li>Open Activity to see the allowed call and the denied call.</li>
      </ol>
      <Button
        variant="secondary"
        onClick={() => {
          void navigator.clipboard.writeText(endpoint).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? "Copied endpoint" : "Copy endpoint"}
      </Button>
    </Card>
  );
};
