"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { connectLabel } from "@/components/connectors/labels";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createProviderConnection } from "@/modules/connectors/connection-api";

export const GithubConnectFlow = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="GitHub"
        title="Connect GitHub"
        description="Give agents a way to read repositories and files, and to open issues. You choose which agents can use GitHub after this connection is saved."
      />
      <Card className="space-y-4">
        <Alert tone="neutral">
          This saves a test connection. AgentVault uses a GitHub credential already configured for this workspace.
          You stay here while connecting, then decide which agents can read GitHub or make changes.
        </Alert>
        <p className="text-sm leading-6 text-ink-soft">
          This connection is shared by the workspace. Open an agent afterward and allow GitHub for the assistants that
          should use it. You can disconnect from the GitHub connection page at any time.
        </p>
        {saveError ? <Alert tone="bad">{saveError}</Alert> : null}
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
          {pending ? "Connecting…" : connectLabel("GitHub")}
        </Button>
      </Card>
    </div>
  );
};
