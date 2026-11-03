"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SelectInput } from "@/components/ui/field";
import { useDemoWorkspace } from "@/hooks/use-demo-workspace";
import { formatDuration, formatTimestamp } from "@/lib/format";

export const ActivityTable = () => {
  const { state } = useDemoWorkspace();
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const rows = state.activity.filter((event) => {
    const statusOk = status === "all" || event.status === status;
    const providerOk = provider === "all" || event.provider === provider;
    return statusOk && providerOk;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit"
        title="Activity"
        description="These rows are sample events shipped with the demo. They were not produced by an MCP tool call."
      />
      <div className="flex flex-wrap gap-3">
        <SelectInput aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)} className="max-w-48">
          <option value="all">All outcomes</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="denied">Denied</option>
        </SelectInput>
        <SelectInput aria-label="Connector" value={provider} onChange={(event) => setProvider(event.target.value)} className="max-w-48">
          <option value="all">All connectors</option>
          <option value="github">GitHub</option>
          <option value="supabase">Supabase</option>
        </SelectInput>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-line bg-paper-2">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs tracking-wide text-ink-soft uppercase">
            <tr>
              {["Agent", "Connector", "Tool", "When", "Decision", "Result", "Duration"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={event.id} className="border-t border-line">
                <td className="px-4 py-3">{event.agentName}</td>
                <td className="px-4 py-3 capitalize">{event.provider}</td>
                <td className="px-4 py-3">{event.toolName}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(event.timestamp)}</td>
                <td className="px-4 py-3">
                  <Badge tone={event.decision === "allow" ? "good" : "warn"}>{event.decision}</Badge>
                  <p className="mt-1 max-w-xs text-xs text-ink-soft">{event.decisionReason}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={event.status === "success" ? "good" : event.status === "denied" ? "warn" : "bad"}>
                    {event.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDuration(event.durationMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-6 text-sm text-ink-soft">No sample events match those filters.</p> : null}
      </div>
    </div>
  );
};
