"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDuration, formatTimestamp } from "@/lib/format";
import { apiRequest } from "@/modules/api/client";
import type { AuditLogRecord } from "@agentvault/shared";

export const ActivityTable = () => {
  const [rows, setRows] = useState<AuditLogRecord[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void apiRequest<AuditLogRecord[]>("/api/audit")
      .then(setRows)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Activity could not be loaded."));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Activity" title="Activity" description="Allowed and denied tool calls for your agents. Credentials and tool payloads are not stored here." />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      {rows.length === 0 ? (
        <Card>
          <p className="text-sm leading-6 text-ink-soft">No activity yet. It appears after an agent calls AgentVault.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-ink-soft">
              <tr>
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">Agent</th>
                <th className="py-2 pr-3 font-medium">Tool</th>
                <th className="py-2 pr-3 font-medium">Decision</th>
                <th className="py-2 pr-3 font-medium">Result</th>
                <th className="py-2 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-3 pr-3">{formatTimestamp(row.createdAt)}</td>
                  <td className="py-3 pr-3">{row.agentName ?? row.agentId}</td>
                  <td className="py-3 pr-3 font-mono text-xs">{row.toolName}</td>
                  <td className="py-3 pr-3">
                    <Badge tone={row.decision === "allow" ? "good" : "bad"}>{row.decision}</Badge>
                  </td>
                  <td className="py-3 pr-3">{row.status}{row.errorCode ? ` · ${row.errorCode}` : ""}</td>
                  <td className="py-3">{row.durationMs === null ? "—" : formatDuration(row.durationMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
