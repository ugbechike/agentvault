"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { useProviderConnections } from "@/hooks/use-provider-connections";
import { previewEffective } from "@/modules/permissions/preview";
import type { DemoAgent } from "@/modules/demo/types";
import {
  capabilityCatalog,
  connectableProviders,
  illustrativeAllowlist,
  type CapabilityId,
  type ProviderId,
} from "@agentvault/shared";

type Preset = "none" | "read" | "write";

const providerLabel: Record<ProviderId, string> = {
  github: "GitHub",
  supabase: "Supabase",
};

const resourceNoun: Record<ProviderId, string> = {
  github: "repository",
  supabase: "project",
};

const readCapability = (provider: ProviderId): CapabilityId =>
  provider === "github" ? "github.read" : "supabase.read";

const writeCapability = (provider: ProviderId): CapabilityId =>
  provider === "github" ? "github.write" : "supabase.write";

const presetFor = (
  permissions: { agentId: string; capability: CapabilityId; allowed: boolean }[],
  agentId: string,
  provider: ProviderId,
): Preset => {
  const write = permissions.some(
    (item) => item.agentId === agentId && item.capability === writeCapability(provider) && item.allowed,
  );
  const read = permissions.some(
    (item) => item.agentId === agentId && item.capability === readCapability(provider) && item.allowed,
  );
  if (write) return "write";
  if (read) return "read";
  return "none";
};

const presetLabel: Record<Preset, string> = {
  none: "No access",
  read: "Read only",
  write: "Read and write",
};

export const AgentAccess = ({ agent }: { agent: DemoAgent }) => {
  const { state, dispatch } = useDemoWorkspace();
  const { connections, error } = useProviderConnections();
  const [provider, setProvider] = useState<ProviderId>("github");
  const [resourceDraft, setResourceDraft] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const active = agent.status === "active";
  const connected = connections.some((item) => item.provider === provider && item.status === "connected");
  const connection = connections.find((item) => item.provider === provider);
  const preset = presetFor(state.permissions, agent.id, provider);
  const tools = illustrativeAllowlist.filter((tool) => tool.provider === provider);
  const resources = state.resources.find((item) => item.agentId === agent.id && item.provider === provider)?.resources ?? [];

  const applyPreset = (next: Preset) => {
    dispatch({
      type: "set-agent-capability",
      agentId: agent.id,
      capability: readCapability(provider),
      allowed: next !== "none",
    });
    dispatch({
      type: "set-agent-capability",
      agentId: agent.id,
      capability: writeCapability(provider),
      allowed: next === "write",
    });
    dispatch({
      type: "clear-tool-policies",
      agentId: agent.id,
      toolNames: tools.map((tool) => tool.agentvaultName),
    });
  };

  const addResource = () => {
    const value = resourceDraft.trim();
    if (!value || resources.includes(value)) {
      setResourceDraft("");
      return;
    }
    dispatch({
      type: "set-agent-resources",
      agentId: agent.id,
      provider,
      resources: [...resources, value],
    });
    setResourceDraft("");
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <p className="text-sm font-medium">Browser preview only</p>
        <p className="text-sm leading-6 text-ink-soft">
          Provider connections come from the API. The access choices below stay in this browser. They are not saved on
          the server and they are not enforced on a tool call.
        </p>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
      </Card>
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-2">
          {connectableProviders.map((item) => {
            const itemConnected = connections.some(
              (connectionItem) => connectionItem.provider === item && connectionItem.status === "connected",
            );
            const itemPreset = presetFor(state.permissions, agent.id, item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setProvider(item);
                  setAdvanced(false);
                }}
                className={`w-full rounded-2xl border px-3 py-3 text-left ${
                  provider === item ? "border-ink bg-paper-2" : "border-line bg-paper"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{providerLabel[item]}</span>
                  <Badge tone={itemConnected ? "good" : "neutral"}>{itemConnected ? "Connected" : "Not connected"}</Badge>
                </span>
                <span className="mt-1 block text-xs text-ink-soft">{presetLabel[itemPreset]}</span>
              </button>
            );
          })}
        </div>
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{providerLabel[provider]}</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {connected
                  ? `Connected${connection?.providerAccountId ? ` · ${connection.providerAccountId}` : ""}. The API does not return OAuth scopes, so a connected provider is the grant ceiling for this preview.`
                  : "This provider is not connected, so every capability is unavailable."}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">Access preset</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["none", "No access"],
                  ["read", "Read only"],
                  ["write", "Read and write"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={preset === value ? "primary" : "secondary"}
                  disabled={!active}
                  onClick={() => applyPreset(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">
                {resourceNoun[provider]} limits
              </p>
              <p className="text-xs text-ink-soft">Empty means no extra limit in this preview.</p>
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addResource();
              }}
            >
              <input
                value={resourceDraft}
                onChange={(event) => setResourceDraft(event.target.value)}
                placeholder={provider === "github" ? "owner/repository" : "project ref"}
                className="h-10 min-w-0 flex-1 rounded-full border border-line bg-paper-2 px-4 text-sm"
                disabled={!active}
              />
              <Button type="submit" variant="secondary" disabled={!active}>
                Add
              </Button>
            </form>
            <ul className="mt-3 flex flex-wrap gap-2">
              {resources.map((resource) => (
                <li key={resource}>
                  <button
                    type="button"
                    className="rounded-full border border-line px-3 py-1 text-xs"
                    onClick={() =>
                      dispatch({
                        type: "set-agent-resources",
                        agentId: agent.id,
                        provider,
                        resources: resources.filter((item) => item !== resource),
                      })
                    }
                  >
                    {resource} · remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <button type="button" className="text-sm text-copper-deep underline" onClick={() => setAdvanced((value) => !value)}>
              {advanced ? "Hide tool permissions" : "Advanced tool permissions"}
            </button>
            {advanced ? (
              <ul className="mt-3 divide-y divide-line">
                {tools.map((tool) => {
                  const override = state.toolPolicies.find(
                    (item) => item.agentId === agent.id && item.toolName === tool.agentvaultName,
                  );
                  const capabilityAllowed = Boolean(
                    state.permissions.find(
                      (item) => item.agentId === agent.id && item.capability === tool.requiredCapability && item.allowed,
                    ),
                  );
                  const checked = capabilityAllowed && (override?.allowed ?? true);
                  return (
                    <li key={tool.agentvaultName} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium">{tool.agentvaultName}</p>
                        <p className="text-xs text-ink-soft">{tool.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!active || !capabilityAllowed}
                        aria-label={tool.agentvaultName}
                        onChange={() =>
                          dispatch({
                            type: "set-tool-policy",
                            agentId: agent.id,
                            toolName: tool.agentvaultName,
                            allowed: !checked,
                          })
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">Effective preview</p>
            <ul className="mt-2 space-y-2">
              {capabilityCatalog
                .filter((capability) => capability.provider === provider)
                .map((capability) => {
                  const preview = previewEffective(state, agent.id, capability.id, connected);
                  const reason = !connected
                    ? "Unavailable. Connect this provider before an agent policy can take effect."
                    : !preview.agentAllowed
                      ? "Denied by this agent's policy. The connection exists, and this choice is not enforced."
                      : resources.length > 0
                        ? `Preview allow, limited to ${resources.join(", ")}. Not enforced.`
                        : "Preview allow for the connected provider. Not enforced.";
                  return (
                    <li key={capability.id} className="rounded-2xl border border-line px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{capability.label}</p>
                        <Badge tone={preview.effective ? "good" : "neutral"}>{preview.effective ? "Preview allow" : "Denied"}</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-ink-soft">{reason}</p>
                    </li>
                  );
                })}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};
