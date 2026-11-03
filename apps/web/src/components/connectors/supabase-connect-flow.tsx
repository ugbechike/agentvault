"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
        description="The project ref is stored on the connection. Agent access is configured on the agent page."
      />
      <Card className="space-y-4">
        <Field label="Project ref" htmlFor="project-ref" hint="The ref from the Supabase project URL.">
          <TextInput
            id="project-ref"
            value={projectRef}
            onChange={(event) => setProjectRef(event.target.value)}
            autoComplete="off"
          />
        </Field>
        <p className="text-sm leading-6 text-ink-soft">
          The API stores the credential name <span className="font-medium">SUPABASE_MCP_TOKEN</span>. Supabase OAuth
          redirect is not part of this step.
        </p>
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
          {pending ? "Saving connection…" : "Save Supabase connection"}
        </Button>
      </Card>
    </div>
  );
};
