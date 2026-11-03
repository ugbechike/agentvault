import {
  capabilityIds,
  illustrativeAllowlist,
  type CapabilityId,
  type EffectiveAccessInput,
  type PermissionCheckRequest,
  type PermissionDecision,
  type PermissionReasonCode,
} from "@agentvault/shared";
import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { agentPermissions, agentResourceGrants, agents, agentToolPolicies } from "@/db/schema";
import { getConnection } from "@/modules/connectors/services/connection.service";
import { evaluateResourceScope, type ResourceAccessLevel } from "@/modules/permissions/policies/resource-policy";

const isCapability = (value: string): value is CapabilityId => capabilityIds.includes(value as CapabilityId);
const isResourceAccess = (value: string): value is ResourceAccessLevel =>
  value === "read" || value === "write" || value === "deny";

const decisionOf = (
  input: Pick<EffectiveAccessInput, "agentId" | "connectionId" | "toolName" | "requiredCapability">,
  outcome: "allow" | "deny",
  reasonCode: PermissionReasonCode,
  reason: string,
): PermissionDecision => ({
  outcome,
  reasonCode,
  reason,
  capability: input.requiredCapability,
  agentId: input.agentId,
  connectionId: input.connectionId,
  toolName: input.toolName,
});

export const evaluateEffectiveAccess = async (
  request: PermissionCheckRequest,
  options?: { arguments?: Record<string, unknown> },
): Promise<PermissionDecision> => {
  const match = illustrativeAllowlist.find((tool) => tool.agentvaultName === request.toolName);
  const db = getDatabase();
  const connection = await getConnection(request.connectionId);
  const [agent] = await db.select().from(agents).where(eq(agents.id, request.agentId)).limit(1);
  const permissions = await db
    .select()
    .from(agentPermissions)
    .where(and(eq(agentPermissions.agentId, request.agentId), eq(agentPermissions.connectionId, request.connectionId)));
  const policies = await db.select().from(agentToolPolicies).where(eq(agentToolPolicies.agentId, request.agentId));
  const grants = await db
    .select()
    .from(agentResourceGrants)
    .where(and(eq(agentResourceGrants.agentId, request.agentId), eq(agentResourceGrants.connectionId, request.connectionId)));

  const requiredCapability = match?.requiredCapability ?? request.capability;
  const base = {
    agentId: request.agentId,
    connectionId: request.connectionId,
    toolName: request.toolName,
    requiredCapability,
  };

  if (!match || match.requiredCapability !== request.capability) {
    return decisionOf(base, "deny", "TOOL_NOT_ALLOWLISTED", "That tool is not on the AgentVault allowlist.");
  }
  if (!agent || agent.userId !== connection.userId) {
    return decisionOf(base, "deny", "AGENT_POLICY_DENY", "This agent cannot use that connection.");
  }

  const discovered = connection.tools.some(
    (tool) => tool.enabled && tool.upstreamToolName === match.exampleUpstreamName,
  );
  const capabilityDecision = intersectAccess({
    ...base,
    providerGranted: connection.grantedCapabilities,
    agentAllowed: permissions.filter((row) => row.allowed).map((row) => row.capability).filter(isCapability),
    toolAllowlisted: discovered,
    connectionActive: connection.status === "connected",
    agentActive: agent.status === "active",
  });
  if (capabilityDecision.outcome !== "allow") return capabilityDecision;

  const policy = policies.find((row) => row.toolName === match.agentvaultName);
  if (policy && !policy.allowed) {
    return decisionOf(base, "deny", "TOOL_POLICY_DENY", "This tool is turned off for the agent.");
  }

  const scope = evaluateResourceScope({
    tool: match,
    args: options?.arguments ?? {},
    grants: grants.flatMap((grant) => (isResourceAccess(grant.access) ? [{ resourceKey: grant.resourceKey, access: grant.access }] : [])),
    capability: requiredCapability.endsWith(".write") ? "write" : "read",
    connectionProjectRef: connection.providerAccountId,
  });
  if (scope) return decisionOf(base, "deny", scope.reasonCode, scope.reason);
  return capabilityDecision;
};

export const intersectAccess = (input: EffectiveAccessInput): PermissionDecision => {
  const decision = (outcome: "allow" | "deny", reasonCode: PermissionReasonCode, reason: string): PermissionDecision =>
    decisionOf(input, outcome, reasonCode, reason);

  if (!input.connectionActive) return decision("deny", "CONNECTION_INACTIVE", "The provider connection is not active.");
  if (!input.agentActive) return decision("deny", "AGENT_REVOKED", "The agent is revoked.");
  if (!input.toolAllowlisted) return decision("deny", "TOOL_NOT_ALLOWLISTED", "The tool is not an enabled capability of this connection.");
  if (!input.providerGranted.includes(input.requiredCapability)) {
    return decision("deny", "PROVIDER_SCOPE_MISSING", "The provider authorization does not include this capability.");
  }
  if (!input.agentAllowed.includes(input.requiredCapability)) {
    return decision("deny", "AGENT_POLICY_DENY", "This agent is not allowed to use that capability.");
  }
  return decision("allow", "ALLOWED", "Allowed.");
};
