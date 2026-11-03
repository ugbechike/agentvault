import { getDatabase } from "@/db/client";
import { agents, connectorDefinitions, discoveredTools, userConnections } from "@/db/schema";
import type { MappedAgentVaultTool, ProviderId } from "@agentvault/shared";

import { connectableProviders, illustrativeAllowlist } from "@agentvault/shared";
import { and, eq, inArray } from "drizzle-orm";
import { mapUpstreamTool } from "../gateway/tool-mapper";
import { filterToolsForAgent } from "../gateway/tool-filter";
import { AppError } from "@/lib/errors/app-error";

export interface AdvertisedTool {
  agentvaultName: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const isProviderId = (value: string): value is ProviderId =>
  connectableProviders.includes(value as ProviderId);


export const listAdvertisedTools = async (agentId: string): Promise<readonly AdvertisedTool[]> => {
  const db = getDatabase();
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  if (!agent || agent.status !== "active") return [];


  const connections = await db
    .select({id : userConnections.id, provider: connectorDefinitions.provider})
    .from(userConnections)
    .innerJoin(connectorDefinitions, eq(userConnections.connectorId, connectorDefinitions.id))
    .where(and(eq(userConnections.userId, agent.userId), eq(userConnections.status, "connected")));
    
  if (connections.length === 0) return [];

  const rows = await db
  .select()
  .from(discoveredTools)
  .where(
    and(
      inArray(discoveredTools.connectionId, connections.map((connection) => connection.id)),
      eq(discoveredTools.enabled, true),
    ),
  );

  
  const providerByConnection = new Map(connections.map((connection) => [connection.id, connection.provider]));
  const mapped: MappedAgentVaultTool[] = [];
 
  for (const row of rows) {
    const provider = providerByConnection.get(row.connectionId);
    if (!provider || !isProviderId(provider)) continue;
    const tool = mapUpstreamTool({
      connectionId: row.connectionId,
      provider,
      upstream: {
        upstreamName: row.upstreamToolName,
        description: row.description,
        inputSchema: row.inputSchema as Record<string, unknown>,
      },
    });
    if (tool) mapped.push(tool);
  }

  const visible = await filterToolsForAgent(agentId, mapped);
  const seen = new Set<string>();

  return visible.map((tool) => {
    if (seen.has(tool.agentvaultName)) {
      throw new AppError(409, "TOOL_NAME_COLLISION", `AgentVault name ${tool.agentvaultName} is published by more than one connection.`);
    }
    seen.add(tool.agentvaultName);
    return requireAllowlistedTool(tool);
  });

};

export const requireAllowlistedTool = (tool: MappedAgentVaultTool): AdvertisedTool => {
 const match = illustrativeAllowlist.find(entry => entry.agentvaultName === tool.agentvaultName);
 if (!match) {
  throw new Error(`Tool ${tool.agentvaultName} not found in allowlist`);
 }
 return {
  agentvaultName: match.agentvaultName,
  description: match.description,
  inputSchema: tool.inputSchema,
 };
};
