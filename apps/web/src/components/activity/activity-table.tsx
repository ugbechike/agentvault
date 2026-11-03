"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const ActivityTable = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit"
        title="Activity"
        description="Audit rows will list agent, connector, tool, decision, and result when the server records them."
      />
      <Card>
        <p className="text-sm leading-6 text-ink-soft">
          The audit API does not return events yet. This page stays empty rather than showing sample traffic.
        </p>
      </Card>
    </div>
  );
};
