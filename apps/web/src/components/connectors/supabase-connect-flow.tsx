"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { startSupabaseAuthorization } from "@/modules/connectors/connection-api";

export const SupabaseConnectFlow = () => {
  const [projectRef, setProjectRef] = useState("");
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Supabase"
        title="Connect Supabase"
        description="A Supabase connection has to be scoped to one project and kept read-only. That authorization is not configured."
      />
      <Card className="space-y-4">
        <Alert tone="warn">
          Supabase stays disconnected. A project-scoped OAuth client is not configured, and arbitrary SQL is not treated as a read-only action.
        </Alert>
        <Field label="Project reference" htmlFor="project-ref" hint="Saved only after a real Supabase authorization succeeds.">
          <TextInput id="project-ref" value={projectRef} onChange={(event) => setProjectRef(event.target.value)} autoComplete="off" />
        </Field>
        {saveError ? <Alert tone="bad">{saveError}</Alert> : null}
        <Button
          disabled={pending || projectRef.trim().length === 0}
          onClick={() => {
            setPending(true);
            setSaveError(undefined);
            void startSupabaseAuthorization().catch((cause: unknown) => {
              setSaveError(cause instanceof Error ? cause.message : "Supabase could not be connected.");
              setPending(false);
            });
          }}
        >
          {pending ? "Checking…" : "Check Supabase authorization"}
        </Button>
      </Card>
    </div>
  );
};
