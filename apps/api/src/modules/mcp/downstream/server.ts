import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { handleToolsCall, handleToolsList } from "./tool-handlers";
import { getDatabase } from "@/db/client";
import { eq } from "drizzle-orm";
import { agents } from "@/db/schema";


// example of downstream MCP server that Cursor, Claude code, ChatGPT, etc. connects to.
export interface DownstreamMcpServer {
  createServer(agentId: string): Promise<McpServer>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export const createDownstreamMcpServer = (): DownstreamMcpServer => {

  
  return {
    createServer: async (agentId: string) => {
      const [agent] = await getDatabase()
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);
      if (!agent) throw new Error("MCP caller was not found.");


      const server = new McpServer({ name: "agentvault", version: "1.0.0",});
      const tools = await handleToolsList(agent.id);

      for (const tool of tools) {
        server.registerTool(tool.agentvaultName, {
          description: tool.description,
          inputSchema: z.fromJSONSchema(tool.inputSchema),
        }, async (args) => {
          const result  = await handleToolsCall({
            agentId: agent.id,
            userId: agent.userId,
            agentvaultToolName: tool.agentvaultName,
            arguments: args as Record<string, unknown>,
          });
          return {
            content: result.content.map((block) => ({
              type: "text" as const,
              text: block.text,
            })),
            isError: result.isError,
          };
        });
      }
      return server;
    },
    start: async () => {},
    stop: async () => {},
  };
};
