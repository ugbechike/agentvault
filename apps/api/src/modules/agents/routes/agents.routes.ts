import { createAgentSchema, idParamSchema, updateAgentSchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as agentService from "@/modules/agents/services/agent.service";

export const registerAgentRoutes = (app: FastifyInstance): void => {
  app.get("/api/agents", async () => agentService.listAgents());

  app.post("/api/agents", async (request) => {
    const body = createAgentSchema.parse(request.body);
    return agentService.createAgent(body);
  });

  app.get("/api/agents/:id", async (request) => {
    const params = idParamSchema.parse(request.params);
    return agentService.getAgent(params.id);
  });

  app.patch("/api/agents/:id", async (request) => {
    const params = idParamSchema.parse(request.params);
    const body = updateAgentSchema.parse(request.body);
    return agentService.updateAgent(params.id, body);
  });

  app.delete("/api/agents/:id", async (request) => {
    const params = idParamSchema.parse(request.params);
    return agentService.revokeAgent(params.id);
  });
};
