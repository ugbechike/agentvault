import type { ProviderId } from "@agentvault/shared";

import { accessTokenStorageKey } from "@/modules/auth/dashboard-auth";
import { apiBaseUrl } from "@/lib/format";

export interface ProviderConnection {
  id: string;
  provider: ProviderId;
  providerAccountId: string | null;
  status: string;
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

interface ApiFailure {
  error?: { message?: string };
}

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem(accessTokenStorageKey);
  if (!token) {
    throw new Error("Sign in before connecting a provider.");
  }
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
};

const readError = async (response: Response): Promise<string> => {
  const body = (await response.json().catch(() => null)) as ApiFailure | null;
  return body?.error?.message ?? "The request failed.";
};

export const listProviderConnections = async (): Promise<ProviderConnection[]> => {
  const response = await fetch(`${apiBaseUrl()}/api/connections`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ProviderConnection[];
};

export const createProviderConnection = async (input: {
  provider: ProviderId;
  projectRef?: string;
}): Promise<ProviderConnection> => {
  const response = await fetch(`${apiBaseUrl()}/api/connections`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ProviderConnection;
};

export const disconnectProviderConnection = async (connectionId: string): Promise<void> => {
  const response = await fetch(`${apiBaseUrl()}/api/connections/${connectionId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(await readError(response));
};

export const loadConnectionTools = async (connectionId: string): Promise<DiscoveredConnectionTool[]> => {
  const response = await fetch(`${apiBaseUrl()}/api/connections/${connectionId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { tools?: DiscoveredConnectionTool[] };
  return body.tools ?? [];
};

export const discoverProviderTools = async (connectionId: string): Promise<void> => {
  const response = await fetch(`${apiBaseUrl()}/api/connections/${connectionId}/validate`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(await readError(response));
};
