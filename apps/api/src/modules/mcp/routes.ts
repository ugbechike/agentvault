import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { createDownstreamTransport, MCP_ENDPOINT_PATH } from "@/modules/mcp/downstream/transport";
import { authenticateCaller } from "./downstream/tool-handlers";


export const registerMcpPlaceholderRoutes = (app: FastifyInstance): void => {
  const { nodeHandler } = createDownstreamTransport();

  const handleRequest = async (req: FastifyRequest, reply: FastifyReply) => {
    const identity =await authenticateCaller(req.headers.authorization); 
    Object.assign(req.raw, {
      auth: {
        token: identity.credentialId,
        clientId: identity.agentId,
        scopes: [],
        expiresAt: Math.floor(Date.now() / 1000) + 60 * 60,
      },
    });
    reply.hijack();
    // Note: Fastify has already read the stream, so without it the MCP message is empty. Hence the need to pass in the body.
    return await nodeHandler(req.raw, reply.raw, req.body);
  };


  app.get(MCP_ENDPOINT_PATH, handleRequest);
  app.post(MCP_ENDPOINT_PATH, handleRequest);
  app.delete(MCP_ENDPOINT_PATH, handleRequest);

};
