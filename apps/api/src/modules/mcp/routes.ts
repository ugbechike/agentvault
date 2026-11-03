import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { env } from "@/lib/config/env";
import { createDownstreamTransport, MCP_ENDPOINT_PATH } from "@/modules/mcp/downstream/transport";
import { authenticateCaller } from "./downstream/tool-handlers";

const allowedOrigin = (origin: string | undefined): boolean => {
  if (!origin || origin === "null") return true;
  const allowed = new Set([env.WEB_ORIGIN.replace(/\/$/, ""), env.API_PUBLIC_URL.replace(/\/$/, "")]);
  return allowed.has(origin.replace(/\/$/, ""));
};

export const registerMcpPlaceholderRoutes = (app: FastifyInstance): void => {
  const { nodeHandler } = createDownstreamTransport();

  const handleRequest = async (req: FastifyRequest, reply: FastifyReply) => {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
    if (!allowedOrigin(origin)) {
      return reply.status(403).send({ error: { code: "ORIGIN_REJECTED", message: "Origin was rejected." } });
    }
    const identity = await authenticateCaller(req.headers.authorization);
    Object.assign(req.raw, {
      auth: {
        token: identity.credentialId,
        clientId: identity.agentId,
        scopes: ["mcp"],
        extra: { userId: identity.userId },
      },
    });
    reply.hijack();
    return nodeHandler(req.raw, reply.raw, req.body);
  };


  app.get(MCP_ENDPOINT_PATH, handleRequest);
  app.post(MCP_ENDPOINT_PATH, handleRequest);
  app.delete(MCP_ENDPOINT_PATH, handleRequest);

};
