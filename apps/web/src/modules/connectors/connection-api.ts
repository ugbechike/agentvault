import type { ProviderId } from "@agentvault/shared";

import { apiRequest } from "@/modules/api/client";

export interface ProviderConnection {
  id: string;
  provider: ProviderId;
  providerAccountId: string | null;
  status: string;
  statusDetail: string | null;
  grantedCapabilities: string[];
  readOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveredConnectionTool {
  id: string;
  upstreamToolName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiredCapability: string;
  enabled: boolean;
}

export const listProviderConnections = async (): Promise<ProviderConnection[]> =>
  apiRequest<ProviderConnection[]>("/api/connections");

export const disconnectProviderConnection = async (connectionId: string): Promise<void> => {
  await apiRequest(`/api/connections/${connectionId}`, { method: "DELETE" });
};

export const loadConnectionTools = async (connectionId: string): Promise<DiscoveredConnectionTool[]> => {
  const body = await apiRequest<{ tools?: DiscoveredConnectionTool[] }>(`/api/connections/${connectionId}`);
  return body.tools ?? [];
};

export const discoverProviderTools = async (connectionId: string): Promise<void> => {
  await apiRequest(`/api/connections/${connectionId}/validate`, { method: "POST" });
};

export const startGithubAuthorization = async (): Promise<string> => {
  const body = await apiRequest<{ authorizationUrl: string }>("/api/oauth/github/start", { method: "POST" });
  return body.authorizationUrl;
};

export const startSupabaseAuthorization = async (): Promise<void> => {
  await apiRequest("/api/oauth/supabase/start", { method: "POST" });
  throw new Error("Supabase stayed disconnected because authorization is not configured.");
};
