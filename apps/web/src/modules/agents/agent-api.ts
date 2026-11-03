import type { AgentClientKind, CreateAgentInput } from "@agentvault/shared";

import { apiRequest } from "@/modules/api/client";

export interface AgentCredentialSummary {
  id: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AgentSummary {
  id: string;
  name: string;
  description: string;
  clientKind: AgentClientKind;
  status: "active" | "revoked";
  createdAt: string;
  credentials: AgentCredentialSummary[];
  permissions?: { id: string; connectionId: string; capability: string; allowed: boolean }[];
}

export interface IssuedCredential {
  credentialId: string;
  token: string;
  tokenPrefix: string;
  mcpEndpoint: string;
}

const issuedKey = (agentId: string) => `agentvault-issued:${agentId}`;

export const rememberIssuedCredential = (agentId: string, token: string): void => {
  sessionStorage.setItem(issuedKey(agentId), token);
};

export const readIssuedCredential = (agentId: string): string | null => sessionStorage.getItem(issuedKey(agentId));

export const forgetIssuedCredential = (agentId: string): void => {
  sessionStorage.removeItem(issuedKey(agentId));
};

export const listAgents = async (): Promise<AgentSummary[]> => apiRequest("/api/agents");

export const createAgent = async (input: CreateAgentInput): Promise<{ agent: AgentSummary; credential: IssuedCredential }> =>
  apiRequest("/api/agents", { method: "POST", body: JSON.stringify(input) });

export const getAgent = async (agentId: string): Promise<AgentSummary> => apiRequest(`/api/agents/${agentId}`);

export const revokeAgent = async (agentId: string): Promise<AgentSummary> =>
  apiRequest(`/api/agents/${agentId}`, { method: "DELETE" });

export const rotateAgentCredential = async (agentId: string): Promise<IssuedCredential> =>
  apiRequest(`/api/agents/${agentId}/credentials/rotate`, { method: "POST" });
