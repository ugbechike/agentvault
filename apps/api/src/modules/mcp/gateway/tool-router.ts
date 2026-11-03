import { illustrativeAllowlist, type ToolCallRequest, type ToolCallResult } from "@agentvault/shared";
import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { connectorDefinitions, discoveredTools, userConnections } from "@/db/schema";
import { AppError } from "@/lib/errors/app-error";
import { invokeUpstreamTool } from "@/modules/mcp/upstream/tool-invocation";

export interface RoutedToolCall {
  agentvaultToolName: string;
  upstream: ToolCallRequest;
}

export const routeToolCall = async (
  userId: string,
  agentvaultToolName: string,
  args: Record<string, unknown>,
): Promise<RoutedToolCall> => {
  const match = illustrativeAllowlist.find((tool) => tool.agentvaultName === agentvaultToolName);
  if (!match) throw new AppError(404, "TOOL_NOT_ALLOWLISTED", "That tool is not available.");

  const db = getDatabase();
  const rows = await db
    .select({ id: userConnections.id })
    .from(userConnections)
    .innerJoin(connectorDefinitions, eq(userConnections.connectorId, connectorDefinitions.id))
    .where(
      and(
        eq(userConnections.userId, userId),
        eq(connectorDefinitions.provider, match.provider),
        eq(userConnections.status, "connected"),
      ),
    );
  const connection = rows.length === 1 ? rows[0] : undefined;
  if (!connection) throw new AppError(409, "CONNECTION_UNAVAILABLE", `No single connected ${match.provider} account is available.`);

  const [tool] = await db
    .select()
    .from(discoveredTools)
    .where(
      and(
        eq(discoveredTools.connectionId, connection.id),
        eq(discoveredTools.upstreamToolName, match.exampleUpstreamName),
        eq(discoveredTools.enabled, true),
      ),
    )
    .limit(1);
  if (!tool) throw new AppError(404, "TOOL_NOT_ALLOWLISTED", "That capability was not discovered for this connection.");

  return {
    agentvaultToolName,
    upstream: {
      connectionId: connection.id,
      upstreamToolName: tool.upstreamToolName,
      arguments: args,
    },
  };
};

export const callRoutedTool = async (routed: RoutedToolCall): Promise<ToolCallResult> => {
  try {
    return await invokeUpstreamTool(routed.upstream);
  } catch {
    return toSafeToolError();
  }
};

export const toSafeToolError = (): ToolCallResult => ({
  content: [{ type: "text", text: "The upstream tool call failed." }],
  isError: true,
});
