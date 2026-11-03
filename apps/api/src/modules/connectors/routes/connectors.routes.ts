import { createConnectionSchema, idParamSchema, providerParamSchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as authService from "@/modules/auth/services/auth.service";
import * as connectionService from "@/modules/connectors/services/connection.service";

export const registerConnectorRoutes = (app: FastifyInstance): void => {
  app.get("/api/connectors", async () => connectionService.listConnectors());

  app.get("/api/connectors/:provider", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = providerParamSchema.parse(request.params);
    return connectionService.getConnector(params.provider, userId);
  });

  app.get("/api/connections", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    return connectionService.listConnections(userId);
  });

  app.post("/api/connections", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const body = createConnectionSchema.parse(request.body);
    return connectionService.createConnection(userId, body);
  });

  app.get("/api/connections/:id", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    return connectionService.getOwnedConnection(userId, params.id);
  });

  app.delete("/api/connections/:id", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    return connectionService.deleteConnection(userId, params.id);
  });

  app.post("/api/connections/:id/validate", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    return connectionService.validateConnection(userId, params.id);
  });
};
