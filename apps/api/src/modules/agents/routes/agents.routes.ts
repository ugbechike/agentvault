import { createAgentSchema, idParamSchema, updateAgentSchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as agentService from "@/modules/agents/services/agent.service";
import * as authService from "@/modules/auth/services/auth.service";

export const registerAgentRoutes = (app: FastifyInstance): void => {
  app.get("/api/agents", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    return agentService.listAgents(userId);
  });

  app.post("/api/agents", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const body = createAgentSchema.parse(request.body);
    return agentService.createAgent(userId, body);
  });

  app.get("/api/agents/:id", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    return agentService.getAgent(userId, params.id);
  });

  app.patch("/api/agents/:id", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    const body = updateAgentSchema.parse(request.body);
    return agentService.updateAgent(userId, params.id, body);
  });

  app.delete("/api/agents/:id", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    return agentService.revokeAgent(userId, params.id);
  });

  app.post("/api/agents/:id/credentials/rotate", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const params = idParamSchema.parse(request.params);
    return agentService.rotateAgentCredential(userId, params.id);
  });
};
