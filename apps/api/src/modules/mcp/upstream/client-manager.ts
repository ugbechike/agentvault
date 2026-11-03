import type { ProviderId } from "@agentvault/shared";


import { createUpstreamClient, type UpstreamClientHandle } from "./client-factory";
import { getConnection } from "@/modules/connectors/services/connection.service";
import { GITHUB_REMOTE_MCP_URL } from "@/modules/connectors/adapters/github/github.adapter";
import { SUPABASE_REMOTE_MCP_URL } from "@/modules/connectors/adapters/supabase/supabase.adapter";

export interface ManagedUpstreamClient {
  connectionId: string;
  provider: ProviderId;
  handle: UpstreamClientHandle;
}

const clients = new Map<string, ManagedUpstreamClient>();


export const connectUpstream = async (connectionId: string): Promise<ManagedUpstreamClient> => {
  const existing = clients.get(connectionId);
  if (existing) return existing;


  const endpoints: Record<ProviderId, string> = {
    github: GITHUB_REMOTE_MCP_URL,
    supabase: SUPABASE_REMOTE_MCP_URL,
  };

  const connection = await getConnection(connectionId);

  const handle = await createUpstreamClient({
    connectionId: connection.id,
    provider: connection.provider,
    endpoint: endpoints[connection.provider],
    credentialReference: connection.encryptedCredentialReference,
  });

  const managed = {
    connectionId,
    provider: connection.provider,
    handle,
  }
  clients.set(connectionId, managed);
  return managed;

};

export const disconnectUpstream = async (connectionId: string): Promise<void> => {
  const managed = clients.get(connectionId);
  if (!managed) return;

  clients.delete(connectionId);
  await managed.handle.client.close();
};
