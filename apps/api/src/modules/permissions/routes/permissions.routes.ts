import { idParamSchema, permissionCheckSchema, putAgentPermissionSchema, saveAgentAccessSchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as authService from "@/modules/auth/services/auth.service";
import * as permissionService from "@/modules/permissions/services/permission.service";

export const registerPermissionRoutes = (app: FastifyInstance): void => {
  app.get("/api/permissions", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    return permissionService.listPermissions(userId);
  });

  app.put("/api/permissions", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const body = putAgentPermissionSchema.parse(request.body);
    return permissionService.putPermission(userId, body);
  });

  app.put("/api/agents/:id/access", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    const body = saveAgentAccessSchema.parse(request.body);
    return permissionService.saveAgentAccess(userId, params.id, body);
  });

  app.delete("/api/permissions/:id", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    return permissionService.removePermission(userId, params.id);
  });

  app.post("/api/permissions/evaluate", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const body = permissionCheckSchema.parse(request.body);
    return permissionService.evaluatePermission(userId, body);
  });
};
