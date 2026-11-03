"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const ActivityTable = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Activity"
        description="A record of what your agents do with the connections you allow."
      />
      <Card>
        <p className="text-sm leading-6 text-ink-soft">
          Activity will appear here when agents use a connection.
        </p>
      </Card>
    </div>
  );
};
