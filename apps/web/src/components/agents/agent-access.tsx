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
import { connectableProviders, illustrativeAllowlist, type ProviderId } from "@agentvault/shared";

type Preset = "none" | "read" | "write";
type ResourceAccess = "read" | "write" | "deny";

interface ResourceDraft {
  resourceKey: string;
  access: ResourceAccess;
}

const providerLabel: Record<ProviderId, string> = { github: "GitHub", supabase: "Supabase" };
const presetLabel: Record<Preset, string> = { none: "No access", read: "Read only", write: "Read and write" };

interface PermissionResponse {
  permissions: { agentId: string; connectionId: string; capability: string; allowed: boolean }[];
  resources: { agentId: string; connectionId: string; resourceKey: string; access: ResourceAccess }[];
}

export const AgentAccess = ({ agent }: { agent: AgentSummary }) => {
  const { connections, error } = useProviderConnections();
  const [provider, setProvider] = useState<ProviderId>("github");
  const [presetOverride, setPresetOverride] = useState<Preset | null>(null);
  const [resourceOverride, setResourceOverride] = useState<ResourceDraft[] | null>(null);
  const [draft, setDraft] = useState("");
  const [resourceAccess, setResourceAccess] = useState<ResourceAccess>("read");
  const [message, setMessage] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [grants, setGrants] = useState<PermissionResponse>({ permissions: [], resources: [] });

  const connection = connections.find((item) => item.provider === provider && item.status === "connected");

  useEffect(() => {
    let cancelled = false;
    void apiRequest<PermissionResponse>("/api/permissions")
      .then((next) => {
        if (!cancelled) setGrants(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setSaveError(cause instanceof Error ? cause.message : "Permissions could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [agent.id]);

  const savedPreset = useMemo<Preset>(() => {
    if (!connection) return "none";
    const mine = grants.permissions.filter((item) => item.agentId === agent.id && item.connectionId === connection.id && item.allowed);
    if (mine.some((item) => item.capability.endsWith(".write"))) return "write";
    if (mine.some((item) => item.capability.endsWith(".read"))) return "read";
    return "none";
  }, [agent.id, connection, grants.permissions]);

  const savedResources = useMemo<ResourceDraft[]>(
    () =>
      connection
        ? grants.resources
            .filter((item) => item.agentId === agent.id && item.connectionId === connection.id)
            .map((item) => ({ resourceKey: item.resourceKey, access: item.access }))
        : [],
    [agent.id, connection, grants.resources],
  );
  const preset = presetOverride ?? savedPreset;
  const resources = resourceOverride ?? savedResources;

  const save = () => {
    if (!connection) return;
    setPending(true);
    setSaveError(undefined);
    setMessage(undefined);
    void apiRequest(`/api/agents/${agent.id}/access`, {
      method: "PUT",
      body: JSON.stringify({
        connectionId: connection.id,
        read: preset !== "none",
        write: preset === "write",
        resources,
      }),
    })
      .then(() => apiRequest<PermissionResponse>("/api/permissions"))
      .then((next) => {
        setGrants(next);
        setPresetOverride(null);
        setResourceOverride(null);
        setMessage("Access saved. It applies to the next tool call.");
      })
      .catch((cause: unknown) => setSaveError(cause instanceof Error ? cause.message : "Access could not be saved."))
      .finally(() => setPending(false));
  };

  const tools = illustrativeAllowlist.filter((tool) => tool.provider === provider);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <p className="text-sm font-medium">Agent access</p>
        <p className="text-sm leading-6 text-ink-soft">
          Choose what {agent.name} can do. Empty repository list means every repository the GitHub account can reach.
          Adding repositories limits the agent to those names.
        </p>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
      </Card>
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-2">
          {connectableProviders.map((item) => {
            const itemConnected = connections.some((connectionItem) => connectionItem.provider === item && connectionItem.status === "connected");
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setProvider(item);
                  setPresetOverride(null);
                  setResourceOverride(null);
                }}
                className={`w-full rounded-2xl border px-3 py-3 text-left ${provider === item ? "border-ink bg-paper-2" : "border-line bg-paper"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{providerLabel[item]}</span>
                  <Badge tone={itemConnected ? "good" : "neutral"}>{itemConnected ? connectedStatus : notConnectedStatus}</Badge>
                </span>
              </button>
            );
          })}
        </div>
        <Card className="space-y-5">
          {!connection ? <Alert tone="warn">Connect {providerLabel[provider]} before granting access.</Alert> : null}
          <div className="flex flex-wrap gap-2">
            {(["none", "read", "write"] as const).map((item) => (
              <Button key={item} variant={preset === item ? "primary" : "secondary"} disabled={!connection || agent.status !== "active"} onClick={() => setPresetOverride(item)}>
                {presetLabel[item]}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{provider === "github" ? "Repositories" : "Project"}</p>
            <div className="flex flex-wrap gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={provider === "github" ? "owner/repository" : "project ref"}
                className="h-10 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-sm"
              />
              <select value={resourceAccess} onChange={(event) => setResourceAccess(event.target.value as ResourceAccess)} className="h-10 rounded-full border border-line bg-paper px-3 text-sm">
                <option value="read">Read</option>
                <option value="write">Read and write</option>
                <option value="deny">Denied</option>
              </select>
              <Button
                variant="secondary"
                onClick={() => {
                  const resourceKey = draft.trim().toLowerCase();
                  if (!resourceKey || resources.some((item) => item.resourceKey === resourceKey)) return;
                  setResourceOverride([...resources, { resourceKey, access: resourceAccess }]);
                  setDraft("");
                }}
              >
                Add
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              {resources.map((resource) => (
                <li key={resource.resourceKey} className="flex items-center justify-between gap-3">
                  <span className="font-mono">{resource.resourceKey}</span>
                  <span className="text-ink-soft">{resource.access}</span>
                  <button type="button" className="text-clay" onClick={() => setResourceOverride(resources.filter((item) => item.resourceKey !== resource.resourceKey))}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Effective tools</p>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {tools.map((tool) => (
                <li key={tool.agentvaultName}>
                  {tool.agentvaultName} · {preset === "none" || (tool.requiredCapability.endsWith(".write") && preset !== "write") ? "Denied" : "Allowed when the call matches these resources"}
                </li>
              ))}
            </ul>
          </div>
          {saveError ? <Alert tone="bad">{saveError}</Alert> : null}
          {message ? <Alert tone="good">{message}</Alert> : null}
          <Button disabled={!connection || pending || agent.status !== "active"} onClick={save}>
            {pending ? "Saving…" : "Save permissions"}
          </Button>
        </Card>
      </div>
    </div>
  );
};
