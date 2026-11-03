"use client";

import { illustrativeAllowlist, capabilityCatalog } from "@agentvault/shared";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { previewEffective } from "@/modules/permissions/preview";

export const PermissionBoard = () => {
  const { state, dispatch } = useDemoWorkspace();
  const activeAgents = state.agents.filter((agent) => agent.status === "active");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Policy"
        title="Permissions"
        description="Effective access is the overlap of the provider grant and the agent policy. This board previews that rule. The API evaluator returns 501 and fails closed."
      />
      <Alert tone="warn">
        Hiding a tool here would not be authorization. A future tools/call must check the same rule on the server.
      </Alert>
      <div className="grid gap-4 lg:grid-cols-2">
        {capabilityCatalog.map((capability) => {
          const tools = illustrativeAllowlist.filter((tool) => tool.requiredCapability === capability.id);
          const provider = capability.provider;
          const connection = state.connections.find((item) => item.provider === provider);
          const granted = Boolean(connection?.grantedCapabilities.includes(capability.id));
          return (
            <Card key={capability.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl">{capability.label}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{capability.description}</p>
                </div>
                <Badge tone={granted ? "good" : "neutral"}>{granted ? "Provider grant on" : "Provider grant off"}</Badge>
              </div>
              <button
                type="button"
                className="mt-4 rounded-full border border-line px-3 py-1 text-xs disabled:opacity-40"
                disabled={connection?.status !== "connected"}
                onClick={() =>
                  dispatch({
                    type: "set-connection-capability",
                    provider,
                    capability: capability.id,
                    allowed: !granted,
                  })
                }
              >
                {granted ? "Remove simulated provider grant" : "Add simulated provider grant"}
              </button>
              <p className="mt-4 text-xs font-medium tracking-wide text-ink-soft uppercase">Illustrative tools</p>
              <ul className="mt-2 space-y-1 text-sm">
                {tools.map((tool) => (
                  <li key={tool.agentvaultName}>{tool.agentvaultName}</li>
                ))}
              </ul>
              <div className="mt-4 space-y-2">
                {activeAgents.map((agent) => {
                  const preview = previewEffective(state, agent.id, capability.id);
                  return (
                    <div key={agent.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{agent.name}</span>
                      <span className="text-ink-soft">{preview.effective ? "Preview allow" : "Preview deny"}</span>
                      <button
                        type="button"
                        className="rounded-full border border-line px-3 py-1 text-xs disabled:opacity-40"
                        disabled={!preview.agentAllowed && !preview.providerGranted}
                        onClick={() =>
                          dispatch({
                            type: "set-agent-capability",
                            agentId: agent.id,
                            capability: capability.id,
                            allowed: !preview.agentAllowed,
                          })
                        }
                      >
                        {preview.agentAllowed ? "Agent on" : "Agent off"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
