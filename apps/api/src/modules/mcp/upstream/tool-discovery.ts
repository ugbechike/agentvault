import type { UpstreamToolDefinition } from "@agentvault/shared";

import { connectUpstream } from "./client-manager";
import { illustrativeAllowlist, type ConnectionValidation } from "@agentvault/shared";
import { getDatabase } from "@/db/client";
import { discoveredTools } from "@/db/schema";
import { getConnection } from "@/modules/connectors/services/connection.service";


// Note: This function is used to discover the tools available on the upstream MCP server.
// This is how agentvault learns the upstream tools names and descriptions.
export const discoverUpstreamTools = async (
  connectionId: string,
): Promise<readonly UpstreamToolDefinition[]> => {
 const {handle} = await connectUpstream(connectionId);
 const result = await handle.client.listTools();
 return result.tools.map(tool => ({
  upstreamName: tool.name,
  description: tool.description ?? "",
  inputSchema: tool.inputSchema as Record<string, unknown>,
 }))
};


export const syncDiscoveredTools = async (
  connectionId: string,
): Promise<ConnectionValidation> => {
  const connection = await getConnection(connectionId);
  const tools = await discoverUpstreamTools(connectionId);
  const rows = tools.flatMap((tool) => {
    const match = illustrativeAllowlist.find(
      (entry) =>
        entry.provider === connection.provider &&
        entry.exampleUpstreamName === tool.upstreamName,
    );
    if (!match) return [];
    return [{
      connectionId,
      upstreamToolName: tool.upstreamName,
      description: tool.description,
      inputSchema: tool.inputSchema,
      requiredCapability: match.requiredCapability,
      enabled: true,
    }];
  });
  if (rows.length > 0) {
    await getDatabase().insert(discoveredTools).values(rows).onConflictDoNothing();
  }
  return { ok: rows.length > 0, checkedAt: new Date().toISOString() };
};
