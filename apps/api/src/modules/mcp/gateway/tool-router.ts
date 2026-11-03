import { illustrativeAllowlist, type ToolCallRequest, type ToolCallResult } from "@agentvault/shared";

import { invokeUpstreamTool } from "../upstream/tool-invocation";
import { getDatabase } from "@/db/client";
import { connectorDefinitions, userConnections } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export interface RoutedToolCall {
  agentvaultToolName: string;
  upstream: ToolCallRequest;
}

export const routeToolCall = async (userId: string,agentvaultToolName: string, args: Record<string, unknown>): Promise<RoutedToolCall> => {
  if (!agentvaultToolName) {
    throw new Error('AgentVault tool name is required');
  }
  if (!args) {
    throw new Error('Arguments are required');
  }
  if (typeof args !== 'object') {
    throw new Error('Arguments must be an object');
  }

  const match = illustrativeAllowlist.find((tool) => tool.agentvaultName === agentvaultToolName);
  if (!match) throw new Error(`Unknown tool ${agentvaultToolName}`);

  const rows = await getDatabase()
    .select({id: userConnections.id})
    .from(userConnections)
    .innerJoin(connectorDefinitions, eq(userConnections.connectorId, connectorDefinitions.id))
    .where(
      and(
        eq(userConnections.userId, userId),
        eq(connectorDefinitions.provider, match.provider),
        eq(userConnections.status, "connected"),
      ),
    );

    const connection = rows[0];
    if (rows.length !== 1 || !connection) {
      throw new Error(`Expected one connected ${match.provider} connection.`);
    }

  return {
    agentvaultToolName,
    upstream: {
      connectionId: connection.id,
      upstreamToolName: match.exampleUpstreamName,
      arguments: args,
    },
  }

};

export const callRoutedTool = async (routed: RoutedToolCall): Promise<ToolCallResult> => {
  // Note: We invoke upstream tool by passing the tool call request to the upstream tool invocation service
  try {
    return await invokeUpstreamTool(routed.upstream);
  } catch (error) {
    return toSafeToolError(error);
  }
};

export const toSafeToolError = (error: unknown): ToolCallResult => {
  if (error instanceof Error) {
    return {
      content: [{ type: "text", text: "The upstream tool call failed." }],
      isError: true,
    }
  }
  return {
    content: [{ type: 'text', text: 'An unknown error occurred while calling the upstream tool. Please try again later.' }],
    isError: true,
  }
};
