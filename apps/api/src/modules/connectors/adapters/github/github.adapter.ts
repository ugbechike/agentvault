import { capabilityIds, type CapabilityId, type DiscoveredToolRecord } from "@agentvault/shared";

import type { ConnectorAdapter } from "../connector-adapter";

/** Hosted GitHub remote MCP. Confirm the URL against current GitHub docs before connecting. */
export const GITHUB_REMOTE_MCP_URL = "https://api.githubcopilot.com/mcp/";

const isCapabilityId = (value: string): value is CapabilityId =>
  capabilityIds.includes(value as CapabilityId);

const isSchemaRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const githubAdapter: ConnectorAdapter = {
  provider: "github",
  remoteMcpEndpoint: GITHUB_REMOTE_MCP_URL,

  initializeConnection: async (input) => ({
    authorizationRequired: true,
    provider: input.provider,
  }),

  retrieveCredential: async (input) => ({
    reference: input.encryptedCredentialReference,
  }),

  validateConnection: async (input) => {
    const { syncDiscoveredTools } = await import("@/modules/mcp/upstream/tool-discovery");
    return syncDiscoveredTools(input.connectionId);
  },

  discoverTools: async (input) => {
    const { getConnection } = await import("@/modules/connectors/services/connection.service");
    const connection = await getConnection(input.connectionId);
    return connection.tools.flatMap((tool): DiscoveredToolRecord[] => {
      if (!isCapabilityId(tool.requiredCapability)) return [];
      return [
        {
          id: tool.id,
          connectionId: tool.connectionId,
          upstreamToolName: tool.upstreamToolName,
          description: tool.description,
          inputSchema: isSchemaRecord(tool.inputSchema) ? tool.inputSchema : {},
          requiredCapability: tool.requiredCapability,
          enabled: tool.enabled,
        },
      ];
    });
  },

  invokeTool: async (input) => {
    const { invokeUpstreamTool } = await import("@/modules/mcp/upstream/tool-invocation");
    return invokeUpstreamTool({
      connectionId: input.connectionId,
      upstreamToolName: input.upstreamToolName,
      arguments: input.arguments,
    });
  },

  disconnect: async (input) => {
    const { disconnectUpstream } = await import("@/modules/mcp/upstream/client-manager");
    await disconnectUpstream(input.connectionId);
  },
};
