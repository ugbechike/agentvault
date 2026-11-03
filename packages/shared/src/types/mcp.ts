import type { ProviderId } from "../constants/providers";

export type McpTransportName = "streamable-http";

export interface UpstreamConnectionConfig {
  connectionId: string;
  provider: ProviderId;
  /** Remote MCP Streamable HTTP endpoint. */
  endpoint: string;
  /** Opaque credential reference. Never a raw access token. */
  credentialReference: string | null;
  /** Supabase only. Appended by the future Supabase adapter, not by a shared client. */
  projectRef?: string;
}

export interface UpstreamToolDefinition {
  upstreamName: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCallRequest {
  connectionId: string;
  upstreamToolName: string;
  arguments: Record<string, unknown>;
}

export interface ToolContentText {
  type: "text";
  text: string;
}

export interface ToolCallResult {
  content: readonly ToolContentText[];
  isError: boolean;
}

export interface MappedAgentVaultTool {
  agentvaultName: string;
  upstreamToolName: string;
  connectionId: string;
  provider: ProviderId;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface DownstreamToolContext {
  agentId: string;
  userId: string;
  agentvaultToolName: string;
  arguments: Record<string, unknown>;
}

export class IntegrationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IntegrationError";
    this.code = code;
  }
}
