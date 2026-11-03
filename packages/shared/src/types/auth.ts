export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/** Dashboard session. Distinct from provider OAuth and from MCP consumer auth. */
export interface DashboardSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface McpConsumerIdentity {
  agentId: string;
  userId: string;
  credentialId: string;
}
