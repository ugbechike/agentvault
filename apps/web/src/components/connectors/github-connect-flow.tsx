"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ToolList } from "@/components/connectors/tool-list";
import { StepTracker } from "@/components/connectors/step-tracker";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { toolFixtures } from "@/modules/demo/fixtures";
import { createProviderConnection } from "@/modules/connectors/connection-api";
import type { CapabilityId } from "@agentvault/shared";

const steps = [
  "Select GitHub",
  "Provider permissions",
  "Authorization",
  "Connection result",
  "Discovered tools",
  "Agent access",
];

export const GithubConnectFlow = () => {
  const { state } = useDemoWorkspace();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [read, setRead] = useState(true);
  const [write, setWrite] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<Record<string, CapabilityId[]>>({});
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const agents = state.agents.filter((agent) => agent.status === "active");
  const granted: CapabilityId[] = [read ? "github.read" : null, write ? "github.write" : null].filter(
    (item): item is CapabilityId => item !== null,
  );

  const toggleAgent = (agentId: string, capability: CapabilityId) => {
    setSelectedAgents((current) => {
      const existing = current[agentId] ?? [];
      const next = existing.includes(capability)
        ? existing.filter((item) => item !== capability)
        : [...existing, capability];
      return { ...current, [agentId]: next };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="GitHub"
        title="Connect GitHub"
        description="This saves a GitHub connection for the signed-in account. The token stays in the API environment."
      />
      <StepTracker steps={steps} current={step} />
      <Card className="space-y-4">
        {step === 0 ? (
          <>
            <h2 className="font-serif text-2xl">GitHub</h2>
            <p className="text-sm leading-6 text-ink-soft">
              AgentVault will eventually open GitHub OAuth, store an opaque credential reference, and connect to
              https://api.githubcopilot.com/mcp/. That client is not built yet.
            </p>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <h2 className="font-serif text-2xl">Requested provider permissions</h2>
            <p className="text-sm text-ink-soft">These checkboxes are a local preview of a future GitHub grant. GitHub has not been asked.</p>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={read} onChange={() => setRead((value) => !value)} /> GitHub read</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={write} onChange={() => setWrite((value) => !value)} /> GitHub write</label>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h2 className="font-serif text-2xl">Authorization</h2>
            <Alert tone="warn">OAuth redirect is disabled. The button records a simulation flag in this browser.</Alert>
            <Button
              onClick={() => setAuthorized(true)}
              disabled={authorized}
            >
              {authorized ? "Simulation flag set" : "Simulate GitHub authorization"}
            </Button>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <h2 className="font-serif text-2xl">Connection result</h2>
            <Alert tone="good">
              Simulated success for ada-okonkwo. No access token was issued and no MCP session was opened.
            </Alert>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <h2 className="font-serif text-2xl">Tools to review</h2>
            <ToolList
              tools={toolFixtures.filter((tool) => tool.provider === "github")}
              empty="No GitHub fixtures."
            />
          </>
        ) : null}
        {step === 5 ? (
          <>
            <h2 className="font-serif text-2xl">Agent access</h2>
            <p className="text-sm text-ink-soft">An agent cannot be granted a capability that this simulated provider grant does not include.</p>
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-2xl border border-line p-3">
                <p className="text-sm font-medium">{agent.name}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  {(["github.read", "github.write"] as const).map((capability) => (
                    <label key={capability} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={!granted.includes(capability)}
                        checked={(selectedAgents[agent.id] ?? []).includes(capability)}
                        onChange={() => toggleAgent(agent.id, capability)}
                      />
                      {capability}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : null}
        {saveError ? <Alert tone="bad">{saveError}</Alert> : null}
        <div className="flex justify-between">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button disabled={step === 2 && !authorized} onClick={() => setStep((value) => value + 1)}>
              Continue
            </Button>
          ) : (
            <Button
              disabled={pending}
              onClick={() => {
                setPending(true);
                setSaveError(undefined);
                void createProviderConnection({ provider: "github" })
                  .then(() => router.push("/connectors/github"))
                  .catch((cause: unknown) => {
                    setSaveError(cause instanceof Error ? cause.message : "GitHub could not be connected.");
                    setPending(false);
                  });
              }}
            >
              {pending ? "Saving connection…" : "Save GitHub connection"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
