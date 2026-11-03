import { CapabilityId, capabilityIds, illustrativeAllowlist, type EffectiveAccessInput, type PermissionCheckRequest, type PermissionDecision, type PermissionReasonCode } from "@agentvault/shared";

import { getDatabase } from "@/db/client";
import { getConnection } from "@/modules/connectors/services/connection.service";
import { agentPermissions, agents } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Effective access = provider-granted access ∩ AgentVault agent policy.
 * Hiding a tool from discovery is not authorization. Every invocation must call this.
 * Unimplemented evaluation fails closed: this function throws and never returns allow.
 */
export const evaluateEffectiveAccess = async (
  request: PermissionCheckRequest,
): Promise<PermissionDecision> => {
  
  const db = getDatabase();
  const connection = await getConnection(request.connectionId);
  const [agent] = await db.select().from(agents).where(eq(agents.id, request.agentId)).limit(1);
  const permissions = await db
    .select()
    .from(agentPermissions)
    .where(and(eq(agentPermissions.agentId, request.agentId), eq(agentPermissions.connectionId, request.connectionId)));

  const providerGranted = connection.tools
    .filter((tool) => tool.enabled)
    .map((tool) => tool.requiredCapability)
    .filter((capability): capability is CapabilityId => capabilityIds.includes(capability as CapabilityId));

  const agentAllowed = permissions
    .filter((row) => row.allowed)
    .map((row) => row.capability)
    .filter((capability): capability is CapabilityId => capabilityIds.includes(capability as CapabilityId));

  return intersectAccess({
    agentId: request.agentId,
    connectionId: request.connectionId,
    toolName: request.toolName,
    requiredCapability: request.capability,
    providerGranted,
    agentAllowed,
    toolAllowlisted: illustrativeAllowlist.some((tool) => tool.agentvaultName === request.toolName),
    connectionActive: connection.status === "connected",
    agentActive: agent?.status === "active",
  });
};

export const intersectAccess = (input: EffectiveAccessInput): PermissionDecision => {
  const decision = (outcome: "allow" | "deny", reasonCode: PermissionReasonCode, reason: string): PermissionDecision => ({
    outcome,
    reasonCode,
    reason,
    capability: input.requiredCapability,
    agentId: input.agentId,
    connectionId: input.connectionId,
    toolName: input.toolName,
  });


  if (!input.connectionActive) return decision("deny", "CONNECTION_INACTIVE", "Connection is not active.");
  if (!input.agentActive) return decision("deny", "AGENT_REVOKED", "Agent is not active.");
  if (!input.toolAllowlisted) return decision("deny", "TOOL_NOT_ALLOWLISTED", "Tool is not allowlisted.");
  if (!input.providerGranted.includes(input.requiredCapability)) return decision("deny", "PROVIDER_SCOPE_MISSING", "Required capability is not granted by the provider.");
  if (!input.agentAllowed.includes(input.requiredCapability)) return decision("deny", "AGENT_POLICY_DENY", "Required capability is not allowed by the agent policy.");

 return decision("allow", "ALLOWED", "Allowed.");

};
