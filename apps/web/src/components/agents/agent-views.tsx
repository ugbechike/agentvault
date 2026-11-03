"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { formatTimestamp } from "@/lib/format";
import { previewEffective } from "@/modules/permissions/preview";
import { capabilityCatalog, createAgentSchema, type AgentClientKind, type CapabilityId } from "@agentvault/shared";

const clientLabel: Record<AgentClientKind, string> = {
  cursor: "Cursor",
  "claude-code": "Claude Code",
  custom: "Custom MCP client",
};

export const AgentListView = () => {
  const { state } = useDemoWorkspace();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Consumers"
        title="Agents"
        description="An agent is an external MCP client such as Cursor or Claude Code. Registration here does not issue a credential."
        actions={
          <Link href="/agents/new">
            <Button>Register agent</Button>
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {state.agents.map((agent) => (
          <Card key={agent.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl">{agent.name}</h2>
                <p className="text-sm text-ink-soft">{clientLabel[agent.clientKind]}</p>
              </div>
              <Badge tone={agent.status === "active" ? "good" : "bad"}>{agent.status}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-soft">{agent.description}</p>
            <p className="mt-3 text-xs text-ink-soft">Added {formatTimestamp(agent.createdAt)} · browser record</p>
            <Link href={`/agents/${agent.id}`} className="mt-4 inline-block text-sm text-copper-deep underline">
              Configure access
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const RegisterAgentForm = () => {
  const { dispatch } = useDemoWorkspace();
  const router = useRouter();
  const [error, setError] = useState<string>();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agents"
        title="Register an agent"
        description="New agents start with every capability denied. No MCP token is generated."
      />
      <Card>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const parsed = createAgentSchema.safeParse({
              name: data.get("name"),
              description: data.get("description"),
              clientKind: data.get("clientKind"),
            });
            if (!parsed.success) {
              setError(parsed.error.issues[0]?.message ?? "Check the form.");
              return;
            }
            const id = `agt_${crypto.randomUUID()}`;
            dispatch({
              type: "register-agent",
              agent: {
                id,
                name: parsed.data.name,
                description: parsed.data.description,
                clientKind: parsed.data.clientKind,
                status: "active",
                createdAt: new Date().toISOString(),
              },
            });
            router.push(`/agents/${id}`);
          }}
        >
          {error ? <Alert tone="bad">{error}</Alert> : null}
          <Field label="Name" htmlFor="agent-name">
            <TextInput id="agent-name" name="name" />
          </Field>
          <Field label="Description" htmlFor="agent-description">
            <TextArea id="agent-description" name="description" />
          </Field>
          <Field label="Client" htmlFor="clientKind">
            <SelectInput id="clientKind" name="clientKind" defaultValue="cursor">
              <option value="cursor">Cursor</option>
              <option value="claude-code">Claude Code</option>
              <option value="custom">Custom MCP client</option>
            </SelectInput>
          </Field>
          <Button type="submit">Save agent locally</Button>
        </form>
      </Card>
    </div>
  );
};

export const AgentDetailView = ({ agentId }: { agentId: string }) => {
  const { state, dispatch } = useDemoWorkspace();
  const agent = state.agents.find((item) => item.id === agentId);
  const [confirming, setConfirming] = useState(false);

  if (!agent) {
    return <Alert tone="bad">That agent is not in the browser workspace.</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={clientLabel[agent.clientKind]}
        title={agent.name}
        description={agent.description || "No description."}
      />
      <Alert tone="warn">
        These switches preview AgentVault policy. The server does not enforce them, and they cannot exceed a simulated provider grant.
      </Alert>
      {agent.status === "revoked" ? <Alert tone="bad">This agent is revoked in the demo. Grants are cleared.</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {capabilityCatalog.map((capability) => {
          const preview = previewEffective(state, agent.id, capability.id);
          return (
            <Card key={capability.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{capability.label}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{capability.description}</p>
                </div>
                <Badge tone={preview.effective ? "good" : "neutral"}>{preview.effective ? "Preview allow" : "Preview deny"}</Badge>
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                Provider grant {preview.providerGranted ? "on" : "off"} · agent policy {preview.agentAllowed ? "on" : "off"}
              </p>
              <Button
                className="mt-4"
                variant="secondary"
                disabled={agent.status !== "active" || (!preview.agentAllowed && !preview.providerGranted)}
                onClick={() =>
                  dispatch({
                    type: "set-agent-capability",
                    agentId: agent.id,
                    capability: capability.id as CapabilityId,
                    allowed: !preview.agentAllowed,
                  })
                }
              >
                {preview.agentAllowed ? "Remove agent grant" : "Allow for this agent"}
              </Button>
            </Card>
          );
        })}
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">Revoke clears simulated grants for this agent only.</p>
        {confirming ? (
          <Button variant="danger" onClick={() => dispatch({ type: "revoke-agent", agentId: agent.id })}>
            Confirm revoke
          </Button>
        ) : (
          <Button variant="danger" disabled={agent.status === "revoked"} onClick={() => setConfirming(true)}>
            Revoke access
          </Button>
        )}
      </Card>
    </div>
  );
};
