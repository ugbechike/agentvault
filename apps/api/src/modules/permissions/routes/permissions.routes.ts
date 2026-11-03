import { permissionCheckSchema, putAgentPermissionSchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as permissionService from "@/modules/permissions/services/permission.service";

export const registerPermissionRoutes = (app: FastifyInstance): void => {
  app.get("/api/permissions", async () => permissionService.listPermissions());

  app.put("/api/permissions", async (request) => {
    const body = putAgentPermissionSchema.parse(request.body);
    return permissionService.putPermission(body);
  });

  app.post("/api/permissions/evaluate", async (request) => {
    const body = permissionCheckSchema.parse(request.body);
    return permissionService.evaluatePermission(body);
  });
};
