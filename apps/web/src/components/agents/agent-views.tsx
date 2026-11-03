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
import { AgentAccess } from "@/components/agents/agent-access";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { formatTimestamp } from "@/lib/format";
import { createAgentSchema, type AgentClientKind } from "@agentvault/shared";

const clientLabel: Record<AgentClientKind, string> = {
  cursor: "Cursor",
  "claude-code": "Claude Code",
  custom: "Custom agent",
};

export const AgentListView = () => {
  const { state } = useDemoWorkspace();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Agents"
        description="An agent is an AI assistant that can use the connections you allow. New agents start with no access."
        actions={
          <Link href="/agents/new">
            <Button>Register agent</Button>
          </Link>
        }
      />
      {state.agents.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">No agents yet. Add one, then choose which connections it can use.</p>
        </Card>
      ) : null}
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
            <p className="mt-3 text-xs text-ink-soft">Added {formatTimestamp(agent.createdAt)}</p>
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
        description="New agents start with no access. After you save, choose which connections this agent can use."
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
              <option value="custom">Custom agent</option>
            </SelectInput>
          </Field>
          <Button type="submit">Save agent</Button>
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
    return <Alert tone="bad">That agent could not be found.</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={clientLabel[agent.clientKind]}
        title={agent.name}
        description={agent.description || "No description."}
      />
      {agent.status === "revoked" ? <Alert tone="bad">This agent's access has been revoked.</Alert> : null}
      <AgentAccess agent={agent} />
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">Revoke removes this agent's access to your connections.</p>
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
