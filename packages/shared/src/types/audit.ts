import type { PermissionOutcome } from "./permissions";

export type AuditStatus = "success" | "failure" | "denied";

export interface AuditLogRecord {
  id: string;
  userId: string;
  agentId: string;
  connectionId: string;
  toolName: string;
  decision: PermissionOutcome;
  status: AuditStatus;
  createdAt: string;
  /** Present in the product UI. Nullable until a call is timed. */
  durationMs: number | null;
  errorCode: string | null;
  agentName?: string;
}
