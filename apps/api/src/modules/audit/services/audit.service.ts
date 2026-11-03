import type { AuditQuery } from "@agentvault/shared";

import { NotImplementedError } from "@/lib/errors/app-error";

export const listAuditLogs = async (_query: AuditQuery): Promise<never> => {
  throw new NotImplementedError(
    "Audit log query is not implemented.",
    "TODO(AUDIT): Read audit_logs for the signed-in user. Do not write a log that claims a tool ran.",
  );
};

export const recordAuditLog = async (): Promise<never> => {
  throw new NotImplementedError(
    "Audit log insert is not implemented.",
    "TODO(AUDIT): Insert audit_logs after a real permission decision and tool result. Never log tokens.",
  );
};
