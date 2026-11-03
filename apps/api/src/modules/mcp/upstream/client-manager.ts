import type { ProviderId } from "@agentvault/shared";

import { AppError } from "@/lib/errors/app-error";
import { DEMO_REMOTE_MCP_URL } from "@/modules/connectors/adapters/demo/demo.adapter";
import { GITHUB_REMOTE_MCP_URL } from "@/modules/connectors/adapters/github/github.adapter";
import { SUPABASE_REMOTE_MCP_URL } from "@/modules/connectors/adapters/supabase/supabase.adapter";
import { refreshDemoCredential } from "@/modules/connectors/oauth/demo-oauth";
import { assertPublicDemoProvider } from "@/modules/connectors/public-demo";
import { loadConnectionCredential } from "@/modules/connectors/services/credential-store";
import { getConnection } from "@/modules/connectors/services/connection.service";

import { createUpstreamClient, type UpstreamClientHandle } from "./client-factory";

export interface ManagedUpstreamClient {
  connectionId: string;
  userId: string;
  provider: ProviderId;
  handle: UpstreamClientHandle;
}

const clients = new Map<string, ManagedUpstreamClient>();

const endpoints: Record<ProviderId, string> = {
  demo: DEMO_REMOTE_MCP_URL,
  github: GITHUB_REMOTE_MCP_URL,
  supabase: SUPABASE_REMOTE_MCP_URL,
};

const currentToken = async (connectionId: string, provider: ProviderId): Promise<string> => {
  const credential = await loadConnectionCredential(connectionId);
  const expiresAt = credential.expiresAt ? Date.parse(credential.expiresAt) : Number.NaN;
  if (Number.isFinite(expiresAt) && expiresAt < Date.now() + 30_000) {
    if (provider !== "demo") {
      throw new AppError(401, "CREDENTIAL_EXPIRED", "The provider credential expired.");
    }
    return refreshDemoCredential(connectionId);
  }
  return credential.accessToken;
};

export const connectUpstream = async (connectionId: string): Promise<ManagedUpstreamClient> => {
  const connection = await getConnection(connectionId);
  assertPublicDemoProvider(connection.provider);
  const existing = clients.get(connectionId);
  if (existing && existing.userId === connection.userId) return existing;
  if (existing) await disconnectUpstream(connectionId);

  const handle = await createUpstreamClient(
    {
      connectionId: connection.id,
      provider: connection.provider,
      endpoint: endpoints[connection.provider],
      credentialReference: connection.encryptedCredentialReference,
      projectRef: connection.provider === "supabase" ? (connection.providerAccountId ?? undefined) : undefined,
      readOnly: connection.provider === "supabase" ? connection.readOnly : undefined,
    },
    {
      token: () => currentToken(connection.id, connection.provider),
      onUnauthorized: async () => {
        if (connection.provider === "demo") await refreshDemoCredential(connection.id);
      },
    },
  );

  const managed = { connectionId, userId: connection.userId, provider: connection.provider, handle };
  clients.set(connectionId, managed);
  return managed;
};

export const disconnectUpstream = async (connectionId: string): Promise<void> => {
  const managed = clients.get(connectionId);
  if (!managed) return;
  clients.delete(connectionId);
  await managed.handle.client.close().catch(() => undefined);
};

export const closeUpstreamClients = async (): Promise<void> => {
  const ids = [...clients.keys()];
  await Promise.all(ids.map((id) => disconnectUpstream(id)));
};
