import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { UpstreamConnectionConfig } from "@agentvault/shared";

import { IntegrationError } from "@agentvault/shared";

export interface UpstreamClientHandle {
  client: Client;
  transport: StreamableHTTPClientTransport;
}

export interface UpstreamTokenResolver {
  token(): Promise<string>;
  onUnauthorized?(): Promise<void>;
}

export const createUpstreamClient = async (
  config: UpstreamConnectionConfig,
  resolver: UpstreamTokenResolver,
): Promise<UpstreamClientHandle> => {
  const url = new URL(config.endpoint);
  if (config.provider === "supabase") {
    if (!config.projectRef) {
      throw new IntegrationError("PROJECT_REF_REQUIRED", "Supabase MCP requires a project ref.");
    }
    url.searchParams.set("project_ref", config.projectRef);
    if (!config.readOnly) {
      throw new IntegrationError("SUPABASE_READ_ONLY_REQUIRED", "Supabase MCP is only connected in read-only mode.");
    }
    url.searchParams.set("read_only", "true");
  }

  const client = new Client({ name: "agentvault", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(url, {
    authProvider: {
      token: () => resolver.token(),
      onUnauthorized: resolver.onUnauthorized,
    },
  });

  try {
    await client.connect(transport);
  } catch (error) {
    await client.close().catch(() => undefined);
    const code = error instanceof Error && error.name === "UnauthorizedError" ? "UPSTREAM_UNAUTHORIZED" : "UPSTREAM_CONNECT_FAILED";
    throw new IntegrationError(code, "The upstream MCP server rejected the connection.");
  }

  return { client, transport };
};
