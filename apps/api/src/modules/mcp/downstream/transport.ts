import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";

import { createDownstreamMcpServer } from "./server";

export const MCP_ENDPOINT_PATH = "/mcp";

//Note: this file builds the streamable http handlers for the server cursor, Claude code, ChatGPT, etc. can connect to.
export interface DownstreamTransport {
  /** Streamable HTTP handler from createMcpHandler. Mount with toNodeHandler on Fastify. */
  handler: ReturnType<typeof createMcpHandler>;
  nodeHandler: ReturnType<typeof toNodeHandler>;
}

export const createDownstreamTransport = (): DownstreamTransport => {
  const mcp = createDownstreamMcpServer();
  const handler = createMcpHandler(async (ctx) =>  {
    const agentId = ctx.authInfo?.clientId;
    if (!agentId) throw new Error("Missing MCP caller.");
    return mcp.createServer(agentId);
  });
  return {
    handler,
    nodeHandler: toNodeHandler(handler),
  }
};
