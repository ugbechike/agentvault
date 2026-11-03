import { auditQuerySchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as auditService from "@/modules/audit/services/audit.service";
import * as authService from "@/modules/auth/services/auth.service";

export const registerAuditRoutes = (app: FastifyInstance): void => {
  app.get("/api/audit", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const query = auditQuerySchema.parse(request.query);
    return auditService.listAuditLogs(userId, query);
  });
};
