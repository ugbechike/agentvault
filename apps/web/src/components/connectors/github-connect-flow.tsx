"use client";

import { useState } from "react";

import { connectLabel } from "@/components/connectors/labels";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { startGithubAuthorization } from "@/modules/connectors/connection-api";

export const GithubConnectFlow = () => {
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="GitHub"
        title="Connect GitHub"
        description="Authorize your own GitHub account. AgentVault stores that grant and uses it only for the agents you allow."
      />
      <Card className="space-y-4">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-soft">
          <li>GitHub opens so you can approve AgentVault.</li>
          <li>You return here after authorization finishes.</li>
          <li>Available capabilities come from GitHub&apos;s MCP server.</li>
        </ol>
        {saveError ? <Alert tone="bad">{saveError}</Alert> : null}
        <Button
          disabled={pending}
          onClick={() => {
            setPending(true);
            setSaveError(undefined);
            void startGithubAuthorization()
              .then((authorizationUrl) => {
                window.location.assign(authorizationUrl);
              })
              .catch((cause: unknown) => {
                setSaveError(cause instanceof Error ? cause.message : "GitHub authorization could not start.");
                setPending(false);
              });
          }}
        >
          {pending ? "Opening GitHub…" : connectLabel("GitHub")}
        </Button>
      </Card>
    </div>
  );
};
