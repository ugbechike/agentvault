import type { AuditLogRecord, AuditQuery, AuditStatus, PermissionOutcome } from "@agentvault/shared";
import { and, desc, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { agents, auditLogs } from "@/db/schema";

export interface AuditInsert {
  userId: string;
  agentId: string;
  connectionId: string | null;
  toolName: string;
  decision: PermissionOutcome;
  status: AuditStatus;
  durationMs: number | null;
  errorCode: string | null;
}

export const listAuditLogs = async (userId: string, query: AuditQuery): Promise<AuditLogRecord[]> => {
  const filters = [eq(auditLogs.userId, userId)];
  if (query.agentId) filters.push(eq(auditLogs.agentId, query.agentId));
  const rows = await getDatabase()
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      agentId: auditLogs.agentId,
      connectionId: auditLogs.connectionId,
      toolName: auditLogs.toolName,
      decision: auditLogs.decision,
      status: auditLogs.status,
      durationMs: auditLogs.durationMs,
      errorCode: auditLogs.errorCode,
      createdAt: auditLogs.createdAt,
      agentName: agents.name,
    })
    .from(auditLogs)
    .innerJoin(agents, eq(auditLogs.agentId, agents.id))
    .where(and(...filters))
    .orderBy(desc(auditLogs.createdAt))
    .limit(query.limit ?? 50);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    agentId: row.agentId,
    connectionId: row.connectionId ?? "",
    toolName: row.toolName,
    decision: row.decision === "allow" ? "allow" : "deny",
    status: row.status === "success" || row.status === "failure" || row.status === "denied" ? row.status : "failure",
    durationMs: row.durationMs,
    errorCode: row.errorCode,
    createdAt: row.createdAt.toISOString(),
    agentName: row.agentName,
  }));
};

export const recordAuditLog = async (input: AuditInsert): Promise<void> => {
  await getDatabase().insert(auditLogs).values({
    userId: input.userId,
    agentId: input.agentId,
    connectionId: input.connectionId,
    toolName: input.toolName,
    decision: input.decision,
    status: input.status,
    durationMs: input.durationMs,
    errorCode: input.errorCode,
  });
};
