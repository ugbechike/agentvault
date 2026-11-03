import type { CapabilityId } from "../constants/capabilities";

export type PermissionOutcome = "allow" | "deny";

export type PermissionReasonCode =
  | "ALLOWED"
  | "PROVIDER_SCOPE_MISSING"
  | "AGENT_POLICY_DENY"
  | "TOOL_NOT_ALLOWLISTED"
  | "CONNECTION_INACTIVE"
  | "AGENT_REVOKED"
  | "TOOL_POLICY_DENY"
  | "UNKNOWN_OPERATION"
  | "RESOURCE_DENIED"
  | "RESOURCE_UNSCOPED"
  | "EVALUATION_NOT_IMPLEMENTED";

export interface AgentPermissionRecord {
  id: string;
  agentId: string;
  connectionId: string;
  capability: CapabilityId;
  allowed: boolean;
  createdAt: string;
}

/**
 * Identifiers a caller may submit. Grants are loaded on the server.
 * Clients must not send their own allow list.
 */
export interface PermissionCheckRequest {
  agentId: string;
  connectionId: string;
  toolName: string;
  capability: CapabilityId;
}

/**
 * Server-side inputs for the future intersection.
 * Effective access = providerGranted ∩ agentAllowed, then the tool capability must be inside it.
 */
export interface EffectiveAccessInput {
  agentId: string;
  connectionId: string;
  toolName: string;
  requiredCapability: CapabilityId;
  providerGranted: readonly CapabilityId[];
  agentAllowed: readonly CapabilityId[];
  toolAllowlisted: boolean;
  connectionActive: boolean;
  agentActive: boolean;
}

export interface PermissionDecision {
  outcome: PermissionOutcome;
  reasonCode: PermissionReasonCode;
  reason: string;
  capability: CapabilityId;
  agentId: string;
  connectionId: string;
  toolName: string;
}
