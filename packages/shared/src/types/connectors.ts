import type { CapabilityId } from "../constants/capabilities";
import type { ProviderId } from "../constants/providers";

export type ConnectionStatus = "pending" | "connected" | "error" | "disconnected";

export interface UserConnection {
  id: string;
  userId: string;
  connectorId: string;
  provider: ProviderId;
  providerAccountId: string | null;
  /** Opaque pointer to stored credentials. Never a plaintext OAuth token. */
  encryptedCredentialReference: string | null;
  status: ConnectionStatus;
  grantedCapabilities: readonly CapabilityId[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveredToolRecord {
  id: string;
  connectionId: string;
  upstreamToolName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiredCapability: CapabilityId;
  enabled: boolean;
}

export interface InitializeConnectionInput {
  userId: string;
  provider: ProviderId;
  /** Supabase project ref. GitHub does not use this. */
  projectRef?: string;
}

export interface CredentialLookup {
  connectionId: string;
  encryptedCredentialReference: string;
}

export interface CredentialReference {
  reference: string;
}

export interface ValidateConnectionInput {
  connectionId: string;
  provider: ProviderId;
  endpoint: string;
  credentialReference: string;
}

export interface ConnectionValidation {
  ok: boolean;
  checkedAt: string;
}

export interface DiscoverToolsInput {
  connectionId: string;
  provider: ProviderId;
}

export interface InvokeToolInput {
  connectionId: string;
  provider: ProviderId;
  upstreamToolName: string;
  arguments: Record<string, unknown>;
}

export interface DisconnectInput {
  connectionId: string;
  provider: ProviderId;
}
