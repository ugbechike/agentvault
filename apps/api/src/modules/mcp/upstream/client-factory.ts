import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { UpstreamConnectionConfig } from "@agentvault/shared";


export interface UpstreamClientHandle {
  /** Construct with `new Client(...)` from @modelcontextprotocol/client. */
  client: Client;
  /** Construct with `new StreamableHTTPClientTransport(url)`. */
  transport: StreamableHTTPClientTransport;
}

export const createUpstreamClient = async (
  config: UpstreamConnectionConfig,
): Promise<UpstreamClientHandle> => {
  // congif.endpoint is the provider's remote MCP url, streamable-http is the transport name.
  const url = new URL(config.endpoint);
  //Note: This is to set the project_ref in the URL for upstream connections.
  if (config.projectRef) url.searchParams.set("project_ref", config.projectRef);

  const client = new Client({
    name: "agentvault", 
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(url, {
    authProvider: {
      token: async () => {
        const reference = config.credentialReference;
        if (!reference) return undefined;
        return process.env[reference];
      }
    }
  });

  await client.connect(transport);

  return {
    client,
    transport,
  };

 
};
