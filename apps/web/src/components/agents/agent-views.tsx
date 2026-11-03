"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AgentAccess } from "@/components/agents/agent-access";
import { InspectorGuide } from "@/components/mcp/inspector-guide";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { formatTimestamp } from "@/lib/format";
import {
  createAgent,
  forgetIssuedCredential,
  getAgent,
  listAgents,
  readIssuedCredential,
  rememberIssuedCredential,
  revokeAgent,
  rotateAgentCredential,
  type AgentSummary,
} from "@/modules/agents/agent-api";
import { createAgentSchema, type AgentClientKind } from "@agentvault/shared";

const clientLabel: Record<AgentClientKind, string> = {
  cursor: "Cursor",
  "claude-code": "Claude Code",
  custom: "Custom agent",
};

export const AgentListView = () => {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void listAgents()
      .then(setAgents)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Agents could not be loaded."));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Agents"
        title="Agent Connections"
        description="An agent connection is one external MCP client. Each registration gets its own credential. New connections start with no access."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/agents/new?preset=inspector">
              <Button>Register MCP Inspector</Button>
            </Link>
            <Link href="/agents/new">
              <Button variant="secondary">Register another agent</Button>
            </Link>
          </div>
        }
      />
      {error ? <Alert tone="bad">{error}</Alert> : null}
      {agents.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">No agents yet. Add one, then choose which connections it can use.</p>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl">{agent.name}</h2>
                <p className="text-sm text-ink-soft">{clientLabel[agent.clientKind]}</p>
              </div>
              <Badge tone={agent.status === "active" ? "good" : "bad"}>{agent.status}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-soft">{agent.description}</p>
            <p className="mt-3 text-xs text-ink-soft">
              Added {formatTimestamp(agent.createdAt)}
              {agent.credentials[0] ? ` · Credential ${agent.credentials[0].tokenPrefix}…` : ""}
            </p>
            <Link href={`/agents/${agent.id}`} className="mt-4 inline-block text-sm text-copper-deep underline">
              Configure access
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const RegisterAgentForm = ({ preset }: { preset?: "inspector" }) => {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const inspector = preset === "inspector";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agents"
        title={inspector ? "Register MCP Inspector" : "Register an agent"}
        description="Name the client. AgentVault issues a credential once. New connections start with no access."
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
            setPending(true);
            void createAgent(parsed.data)
              .then((created) => {
                rememberIssuedCredential(created.agent.id, created.credential.token);
                router.push(`/agents/${created.agent.id}`);
              })
              .catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : "The agent could not be registered.");
                setPending(false);
              });
          }}
        >
          {error ? <Alert tone="bad">{error}</Alert> : null}
          <Field label="Name" htmlFor="agent-name">
            <TextInput id="agent-name" name="name" placeholder="MCP Inspector" defaultValue={inspector ? "MCP Inspector" : undefined} />
          </Field>
          <Field label="Description" htmlFor="agent-description">
            <TextArea
              id="agent-description"
              name="description"
              defaultValue={inspector ? "Local MCP Inspector used to test this account." : undefined}
            />
          </Field>
          <Field label="Client" htmlFor="clientKind">
            <SelectInput id="clientKind" name="clientKind" defaultValue={inspector ? "custom" : "cursor"}>
              <option value="cursor">Cursor</option>
              <option value="claude-code">Claude Code</option>
              <option value="custom">Custom agent</option>
            </SelectInput>
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save agent"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export const AgentDetailView = ({ agentId }: { agentId: string }) => {
  const [agent, setAgent] = useState<AgentSummary>();
  const [error, setError] = useState<string>();
  const [issued, setIssued] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const token = readIssuedCredential(agentId);
    let cancelled = false;
    void getAgent(agentId)
      .then((next) => {
        if (cancelled) return;
        setAgent(next);
        setIssued(token);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "That agent could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  if (error) return <Alert tone="bad">{error}</Alert>;
  if (!agent) return <p className="text-sm text-ink-soft">Loading agent…</p>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={clientLabel[agent.clientKind]} title={agent.name} description={agent.description || "No description."} />
      {issued ? (
        <Alert tone="warn">
          <span className="block">Copy this MCP credential now. It is not shown again.</span>
          <code className="mt-2 block break-all font-mono text-xs">{issued}</code>
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => {
              forgetIssuedCredential(agent.id);
              setIssued(null);
            }}
          >
            I have copied it
          </Button>
        </Alert>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
              Active credential prefix: {agent.credentials?.[0]?.tokenPrefix ?? "none"}…
          </p>
          <Button
            variant="secondary"
            disabled={agent.status !== "active"}
            onClick={() => {
              void rotateAgentCredential(agent.id).then((credential) => {
                rememberIssuedCredential(agent.id, credential.token);
                setIssued(credential.token);
              });
            }}
          >
            Rotate credential
          </Button>
        </Card>
      )}
      {agent.status === "revoked" ? <Alert tone="bad">This agent&apos;s access has been revoked.</Alert> : null}
      <AgentAccess agent={agent} />
      <InspectorGuide />
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">Revoke removes this credential and its permissions immediately.</p>
        {confirming ? (
          <Button
            variant="danger"
            onClick={() => {
              void revokeAgent(agent.id).then((revoked) => setAgent({ ...agent, ...revoked, credentials: [] }));
            }}
          >
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
