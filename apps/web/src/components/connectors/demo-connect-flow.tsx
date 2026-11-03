"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { startDemoAuthorization } from "@/modules/connectors/connection-api";

export const DemoConnectFlow = () => {
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Demo MCP Provider"
        title="Connect Demo Provider"
        description="Connect to a safe test service and explore how AgentVault manages AI agent access to external tools."
      />
      <Card className="space-y-4">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-soft">
          <li>The demo provider opens so you can approve AgentVault.</li>
          <li>You return here after approval finishes.</li>
          <li>Available actions come from that provider. The connection is not marked successful until those actions are discovered.</li>
        </ol>
        {saveError ? <Alert tone="bad">{saveError}</Alert> : null}
        <Button
          disabled={pending}
          onClick={() => {
            setPending(true);
            setSaveError(undefined);
            void startDemoAuthorization()
              .then((authorizationUrl) => {
                window.location.assign(authorizationUrl);
              })
              .catch((cause: unknown) => {
                setSaveError(cause instanceof Error ? cause.message : "The demo provider could not be opened.");
                setPending(false);
              });
          }}
        >
          {pending ? "Opening the demo provider…" : "Connect Demo Provider"}
        </Button>
      </Card>
    </div>
  );
};
