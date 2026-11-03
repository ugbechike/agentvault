"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
        description="This saves a GitHub connection for the signed-in account. Agent access is configured on the agent page."
      />
      <Card className="space-y-4">
        <p className="text-sm leading-6 text-ink-soft">
          The API stores the credential name <span className="font-medium">GITHUB_MCP_TOKEN</span>. The token stays in
          the API environment. GitHub OAuth redirect is not part of this step.
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
          {pending ? "Saving connection…" : "Save GitHub connection"}
        </Button>
      </Card>
    </div>
  );
};
