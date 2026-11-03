import { illustrativeAllowlist, ProviderId, type MappedAgentVaultTool, type UpstreamToolDefinition } from "@agentvault/shared";


export interface MapToolInput {
  connectionId: string;
  upstream: UpstreamToolDefinition;
  provider: ProviderId;
}

export const mapUpstreamTool = (input: MapToolInput): MappedAgentVaultTool | null => {
  const match = illustrativeAllowlist.find(
    (entry) => entry.provider === input.provider && entry.exampleUpstreamName === input.upstream.upstreamName,
  );
  if (!match) return null;

  return {
    agentvaultName: match.agentvaultName,
    upstreamToolName: input.upstream.upstreamName,
    connectionId: input.connectionId,
    provider: input.provider,
    description: match.description,
    inputSchema: input.upstream.inputSchema,
  };
};
