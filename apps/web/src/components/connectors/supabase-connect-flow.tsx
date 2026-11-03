"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { connectLabel } from "@/components/connectors/labels";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { createProviderConnection } from "@/modules/connectors/connection-api";

export const SupabaseConnectFlow = () => {
  const router = useRouter();
  const [projectRef, setProjectRef] = useState("");
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Supabase"
        title="Connect Supabase"
        description="Choose the Supabase project agents may use. You still decide which agents can read it or make changes."
      />
      <Card className="space-y-4">
        <Field
          label="Project reference"
          htmlFor="project-ref"
          hint="Find this in your Supabase project settings. Agents are limited to this project."
        >
          <TextInput
            id="project-ref"
            value={projectRef}
            onChange={(event) => setProjectRef(event.target.value)}
            autoComplete="off"
          />
        </Field>
        <Alert tone="neutral">
          This saves a test connection. AgentVault uses a Supabase credential already configured for this workspace.
          You stay here while connecting, then choose which agents can use this project.
        </Alert>
        {saveError ? <Alert tone="bad">{saveError}</Alert> : null}
        <Button
          disabled={pending || projectRef.trim().length === 0}
          onClick={() => {
            setPending(true);
            setSaveError(undefined);
            void createProviderConnection({ provider: "supabase", projectRef: projectRef.trim() })
              .then(() => router.push("/connectors/supabase"))
              .catch((cause: unknown) => {
                setSaveError(cause instanceof Error ? cause.message : "Supabase could not be connected.");
                setPending(false);
              });
          }}
        >
          {pending ? "Connecting…" : connectLabel("Supabase")}
        </Button>
      </Card>
    </div>
  );
};
