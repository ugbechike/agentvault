"use client";

import { useEffect, useMemo, useState } from "react";

import { connectedStatus, notConnectedStatus } from "@/components/connectors/labels";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProviderConnections } from "@/hooks/use-provider-connections";
import { apiRequest } from "@/modules/api/client";
import type { AgentSummary } from "@/modules/agents/agent-api";
import { illustrativeAllowlist } from "@agentvault/shared";

interface PermissionResponse {
  permissions: { agentId: string; connectionId: string; capability: string; allowed: boolean }[];
  tools: { agentId: string; toolName: string; allowed: boolean }[];
}

const demoTools = illustrativeAllowlist.filter((tool) => tool.provider === "demo");

export const AgentAccess = ({ agent }: { agent: AgentSummary }) => {
  const { connections, error } = useProviderConnections();
  const connection = connections.find((item) => item.provider === "demo" && item.status === "connected");
  const connectionId = connection?.id;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void apiRequest<PermissionResponse>("/api/permissions")
      .then((grants) => {
        if (cancelled || !connectionId) return;
        const readAllowed = grants.permissions.some(
          (item) => item.agentId === agent.id && item.connectionId === connectionId && item.capability === "demo.read" && item.allowed,
        );
        const policies = grants.tools.filter((item) => item.agentId === agent.id);
        const next = new Set<string>();
        for (const tool of demoTools) {
          const policy = policies.find((item) => item.toolName === tool.agentvaultName);
          if (policy ? policy.allowed : readAllowed) next.add(tool.agentvaultName);
        }
        if (!readAllowed) next.clear();
        setSelected(next);
        setLoaded(true);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setSaveError(cause instanceof Error ? cause.message : "Permissions could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [agent.id, connectionId]);

  const summary = useMemo(
    () => (selected.size === 0 ? "No actions are allowed." : `${selected.size} of ${demoTools.length} read actions are allowed.`),
    [selected],
  );

  const save = () => {
    if (!connection) return;
    setPending(true);
    setSaveError(undefined);
    setMessage(undefined);
    void apiRequest(`/api/agents/${agent.id}/access`, {
      method: "PUT",
      body: JSON.stringify({
        connectionId: connection.id,
        read: selected.size > 0,
        write: false,
        resources: [],
        tools: demoTools.map((tool) => ({
          toolName: tool.agentvaultName,
          allowed: selected.has(tool.agentvaultName),
        })),
      }),
    })
      .then(() => setMessage("Access saved. It applies to the next tool call."))
      .catch((cause: unknown) => setSaveError(cause instanceof Error ? cause.message : "Access could not be saved."))
      .finally(() => setPending(false));
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Agent access</p>
          <Badge tone={connection ? "good" : "neutral"}>{connection ? connectedStatus : notConnectedStatus}</Badge>
        </div>
        <p className="text-sm leading-6 text-ink-soft">
          Choose which demo actions {agent.name} can call. This provider only offers synthetic read actions. An action you leave off is rejected before AgentVault contacts the provider.
        </p>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
      </Card>
      {!connection ? <Alert tone="warn">Connect the demo provider before granting access.</Alert> : null}
      <Card className="space-y-4">
        <p className="text-sm text-ink-soft">{loaded || !connection ? summary : "Loading access…"}</p>
        <ul className="space-y-3">
          {demoTools.map((tool) => {
            const checked = selected.has(tool.agentvaultName);
            return (
              <li key={tool.agentvaultName} className="flex items-start gap-3">
                <input
                  id={tool.agentvaultName}
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  disabled={!connection || agent.status !== "active"}
                  onChange={() => {
                    const next = new Set(selected);
                    if (checked) next.delete(tool.agentvaultName);
                    else next.add(tool.agentvaultName);
                    setSelected(next);
                  }}
                />
                <label htmlFor={tool.agentvaultName} className="text-sm leading-6">
                  <span className="font-medium">{tool.description}</span>
                  <span className="mt-1 block font-mono text-xs text-ink-soft">{tool.agentvaultName}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {saveError ? <Alert tone="bad">{saveError}</Alert> : null}
        {message ? <Alert tone="good">{message}</Alert> : null}
        <Button disabled={!connection || pending || agent.status !== "active"} onClick={save}>
          {pending ? "Saving…" : "Save permissions"}
        </Button>
      </Card>
    </div>
  );
};
