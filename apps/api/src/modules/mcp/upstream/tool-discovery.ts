import { illustrativeAllowlist, type CapabilityId, type ConnectionValidation, type UpstreamToolDefinition } from "@agentvault/shared";
import { eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { discoveredTools } from "@/db/schema";
import { AppError } from "@/lib/errors/app-error";
import { getConnection, setConnectionStatus } from "@/modules/connectors/services/connection.service";

import { connectUpstream, disconnectUpstream } from "./client-manager";

export const discoverUpstreamTools = async (connectionId: string): Promise<readonly UpstreamToolDefinition[]> => {
  const { handle } = await connectUpstream(connectionId);
  const result = await handle.client.listTools();
  return result.tools.map((tool) => ({
    upstreamName: tool.name,
    description: tool.description ?? "",
    inputSchema: (tool.inputSchema ?? {}) as Record<string, unknown>,
  }));
};

export const syncDiscoveredTools = async (connectionId: string): Promise<ConnectionValidation> => {
  const connection = await getConnection(connectionId);
  let tools: readonly UpstreamToolDefinition[];
  try {
    tools = await discoverUpstreamTools(connectionId);
  } catch (error) {
    await disconnectUpstream(connectionId);
    const message = error instanceof AppError ? error.message : "The upstream MCP server did not accept this credential.";
    await setConnectionStatus(connectionId, "error", message);
    throw error instanceof AppError
      ? error
      : new AppError(502, "UPSTREAM_DISCOVERY_FAILED", "The upstream MCP server did not accept this credential.");
  }

  const db = getDatabase();
  await db.delete(discoveredTools).where(eq(discoveredTools.connectionId, connectionId));
  const rows = tools.map((tool) => {
    const match = illustrativeAllowlist.find(
      (entry) => entry.provider === connection.provider && entry.exampleUpstreamName === tool.upstreamName,
    );
    const requiredCapability: CapabilityId = match?.requiredCapability ?? (connection.provider === "github" ? "github.read" : "supabase.read");
    const expose = Boolean(match) && (connection.provider !== "supabase" || connection.readOnly);
    return {
      connectionId,
      upstreamToolName: tool.upstreamName,
      description: tool.description,
      inputSchema: tool.inputSchema,
      requiredCapability,
      enabled: expose,
    };
  });
  if (rows.length > 0) {
    await db.insert(discoveredTools).values(rows);
  }
  const enabled = rows.filter((row) => row.enabled).length;
  await setConnectionStatus(
    connectionId,
    "connected",
    enabled > 0
      ? `Authorized as ${connection.providerAccountId ?? "the provider account"}. ${enabled} capabilities are available.`
      : "Authorized, but none of the discovered tools are on the AgentVault allowlist.",
  );
  return { ok: true, checkedAt: new Date().toISOString() };
};
