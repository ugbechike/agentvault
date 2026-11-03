import { auditQuerySchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as auditService from "@/modules/audit/services/audit.service";

export const registerAuditRoutes = (app: FastifyInstance): void => {
  app.get("/api/audit", async (request) => {
    const query = auditQuerySchema.parse(request.query);
    return auditService.listAuditLogs(query);
  });
};
