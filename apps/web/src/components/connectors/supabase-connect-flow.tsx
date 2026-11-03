"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { StepTracker } from "@/components/connectors/step-tracker";
import { ToolList } from "@/components/connectors/tool-list";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { supabaseProjects, toolFixtures } from "@/modules/demo/fixtures";
import { createProviderConnection } from "@/modules/connectors/connection-api";
import type { CapabilityId } from "@agentvault/shared";

const steps = [
  "Select Supabase",
  "Project access",
  "Choose a project",
  "Authorization",
  "Discovered tools",
  "Agent access",
];

export const SupabaseConnectFlow = () => {
  const { state } = useDemoWorkspace();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [read, setRead] = useState(true);
  const [write, setWrite] = useState(false);
  const [projectRef, setProjectRef] = useState<string>(supabaseProjects[0]?.ref ?? "agentvault-analytics");
  const [authorized, setAuthorized] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<Record<string, CapabilityId[]>>({});
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const agents = state.agents.filter((agent) => agent.status === "active");
  const granted: CapabilityId[] = [read ? "supabase.read" : null, write ? "supabase.write" : null].filter(
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
        eyebrow="Supabase"
        title="Connect Supabase"
        description="This saves a project-scoped Supabase connection for the signed-in account."
      />
      <StepTracker steps={steps} current={step} />
      <Card className="space-y-4">
        {step === 0 ? (
          <>
            <h2 className="font-serif text-2xl">Supabase</h2>
            <p className="text-sm leading-6 text-ink-soft">
              The future adapter connects to https://mcp.supabase.com/mcp with a project_ref. Tool names will be discovered, not copied from GitHub.
            </p>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <h2 className="font-serif text-2xl">Project-level access</h2>
            <p className="text-sm text-ink-soft">
              A Supabase grant covers one project. Read can list tables and query. Write is a separate, narrower grant.
            </p>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={read} onChange={() => setRead((value) => !value)} /> Supabase read</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={write} onChange={() => setWrite((value) => !value)} /> Supabase write</label>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h2 className="font-serif text-2xl">Choose a project</h2>
            <p className="text-sm text-ink-soft">These projects are fixtures. AgentVault has not listed your Supabase organization.</p>
            <div className="space-y-2">
              {supabaseProjects.map((project) => (
                <label key={project.ref} className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="project"
                    checked={projectRef === project.ref}
                    onChange={() => setProjectRef(project.ref)}
                  />
                  {project.name}
                  <span className="text-ink-soft">{project.region}</span>
                </label>
              ))}
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <h2 className="font-serif text-2xl">Authorization</h2>
            <Alert tone="warn">
              Supabase OAuth is not wired. This does not send the project ref {projectRef} to Supabase.
            </Alert>
            <Button disabled={authorized} onClick={() => setAuthorized(true)}>
              {authorized ? "Simulation flag set" : "Simulate Supabase authorization"}
            </Button>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <h2 className="font-serif text-2xl">Tools to review</h2>
            <Alert tone="neutral">Marked as fixtures. tools/list did not run against the selected project.</Alert>
            <ToolList tools={toolFixtures.filter((tool) => tool.provider === "supabase")} empty="No Supabase fixtures." />
          </>
        ) : null}
        {step === 5 ? (
          <>
            <h2 className="font-serif text-2xl">Agent access</h2>
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-2xl border border-line p-3">
                <p className="text-sm font-medium">{agent.name}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  {(["supabase.read", "supabase.write"] as const).map((capability) => (
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
            <Button disabled={step === 3 && !authorized} onClick={() => setStep((value) => value + 1)}>
              Continue
            </Button>
          ) : (
            <Button
              disabled={pending}
              onClick={() => {
                setPending(true);
                setSaveError(undefined);
                void createProviderConnection({ provider: "supabase", projectRef })
                  .then(() => router.push("/connectors/supabase"))
                  .catch((cause: unknown) => {
                    setSaveError(cause instanceof Error ? cause.message : "Supabase could not be connected.");
                    setPending(false);
                  });
              }}
            >
              {pending ? "Saving connection…" : "Save Supabase connection"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
