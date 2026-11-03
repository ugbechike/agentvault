import {
  illustrativeAllowlist,
  type CapabilityId,
  type PermissionCheckInput,
  type PutAgentPermissionInput,
  type SaveAgentAccessInput,
} from "@agentvault/shared";
import { and, eq, inArray } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { agentPermissions, agentResourceGrants, agents, agentToolPolicies, connectorDefinitions, userConnections } from "@/db/schema";
import { AppError } from "@/lib/errors/app-error";
import { assertPublicDemoProvider } from "@/modules/connectors/public-demo";
import { getConnection } from "@/modules/connectors/services/connection.service";
import { evaluateEffectiveAccess } from "@/modules/permissions/policies/effective-access";

const requireOwnedAgent = async (userId: string, agentId: string) => {
  const [agent] = await getDatabase()
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.userId, userId)))
    .limit(1);
  if (!agent) throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
  return agent;
};

export const listPermissions = async (userId: string) => {
  const rows = await getDatabase()
    .select({
      id: agentPermissions.id,
      agentId: agentPermissions.agentId,
      connectionId: agentPermissions.connectionId,
      capability: agentPermissions.capability,
      allowed: agentPermissions.allowed,
      createdAt: agentPermissions.createdAt,
    })
    .from(agentPermissions)
    .innerJoin(agents, eq(agentPermissions.agentId, agents.id))
    .where(eq(agents.userId, userId));
  const toolPolicies = await getDatabase()
    .select({
      agentId: agentToolPolicies.agentId,
      toolName: agentToolPolicies.toolName,
      allowed: agentToolPolicies.allowed,
    })
    .from(agentToolPolicies)
    .innerJoin(agents, eq(agentToolPolicies.agentId, agents.id))
    .where(eq(agents.userId, userId));
  const resources = await getDatabase()
    .select({
      agentId: agentResourceGrants.agentId,
      connectionId: agentResourceGrants.connectionId,
      resourceKey: agentResourceGrants.resourceKey,
      access: agentResourceGrants.access,
    })
    .from(agentResourceGrants)
    .innerJoin(agents, eq(agentResourceGrants.agentId, agents.id))
    .where(eq(agents.userId, userId));
  return {
    permissions: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    resources,
    tools: toolPolicies,
  };
};

const upsertCapability = async (agentId: string, connectionId: string, capability: CapabilityId, allowed: boolean) => {
  const db = getDatabase();
  const [existing] = await db
    .select()
    .from(agentPermissions)
    .where(
      and(
        eq(agentPermissions.agentId, agentId),
        eq(agentPermissions.connectionId, connectionId),
        eq(agentPermissions.capability, capability),
      ),
    )
    .limit(1);
  if (existing) {
    await db.update(agentPermissions).set({ allowed }).where(eq(agentPermissions.id, existing.id));
    return;
  }
  await db.insert(agentPermissions).values({ agentId, connectionId, capability, allowed });
};

export const putPermission = async (userId: string, input: PutAgentPermissionInput) => {
  await requireOwnedAgent(userId, input.agentId);
  const connection = await getConnection(input.connectionId);
  if (connection.userId !== userId) throw new AppError(404, "CONNECTION_NOT_FOUND", "Connection not found.");
  assertPublicDemoProvider(connection.provider);
  if (input.allowed && !connection.grantedCapabilities.includes(input.capability)) {
    throw new AppError(403, "PROVIDER_SCOPE_MISSING", "The provider authorization does not include that capability.");
  }
  await upsertCapability(input.agentId, input.connectionId, input.capability, input.allowed);
  return { ok: true };
};

export const saveAgentAccess = async (userId: string, agentId: string, input: SaveAgentAccessInput) => {
  const agent = await requireOwnedAgent(userId, agentId);
  if (agent.status !== "active") throw new AppError(409, "AGENT_REVOKED", "Revoked agents cannot receive new access.");
  const connection = await getConnection(input.connectionId);
  if (connection.userId !== userId) throw new AppError(404, "CONNECTION_NOT_FOUND", "Connection not found.");
  assertPublicDemoProvider(connection.provider);
  if (input.write) {
    throw new AppError(403, "PROVIDER_SCOPE_MISSING", "This provider does not include a write action.");
  }
  const readCapability: CapabilityId = "demo.read";
  const write = false;
  const read = input.read || write;
  if (read && !connection.grantedCapabilities.includes(readCapability)) {
    throw new AppError(403, "PROVIDER_SCOPE_MISSING", "That access is wider than the provider authorization.");
  }
  for (const resource of input.resources) {
    if (resource.access === "write" && !write) {
      throw new AppError(400, "RESOURCE_CONFLICT", "A write resource requires write access on the connection.");
    }
    if (resource.access === "read" && !read) {
      throw new AppError(400, "RESOURCE_CONFLICT", "A read resource requires read access on the connection.");
    }
  }
  await upsertCapability(agentId, input.connectionId, readCapability, read);

  const db = getDatabase();
  await db
    .delete(agentResourceGrants)
    .where(and(eq(agentResourceGrants.agentId, agentId), eq(agentResourceGrants.connectionId, input.connectionId)));
  if (input.resources.length > 0) {
    await db.insert(agentResourceGrants).values(
      input.resources.map((resource) => ({
        agentId,
        connectionId: input.connectionId,
        resourceKey: resource.resourceKey.trim().toLowerCase(),
        access: resource.access,
      })),
    );
  }

  const providerTools = illustrativeAllowlist.filter((tool) => tool.provider === connection.provider).map((tool) => tool.agentvaultName);
  if (providerTools.length > 0) {
    await db
      .delete(agentToolPolicies)
      .where(and(eq(agentToolPolicies.agentId, agentId), inArray(agentToolPolicies.toolName, providerTools)));
  }
  const toolPolicies = (input.tools ?? []).filter((tool) => providerTools.includes(tool.toolName));
  if (toolPolicies.length > 0) {
    await db.insert(agentToolPolicies).values(
      toolPolicies.map((tool) => ({ agentId, toolName: tool.toolName, allowed: tool.allowed })),
    );
  }
  return listPermissions(userId);
};

export const removePermission = async (userId: string, permissionId: string) => {
  const [row] = await getDatabase()
    .select({ id: agentPermissions.id, userId: agents.userId })
    .from(agentPermissions)
    .innerJoin(agents, eq(agentPermissions.agentId, agents.id))
    .where(eq(agentPermissions.id, permissionId))
    .limit(1);
  if (!row || row.userId !== userId) throw new AppError(404, "PERMISSION_NOT_FOUND", "Permission not found.");
  await getDatabase().delete(agentPermissions).where(eq(agentPermissions.id, permissionId));
  return { ok: true };
};

export const evaluatePermission = async (userId: string, input: PermissionCheckInput) => {
  await requireOwnedAgent(userId, input.agentId);
  const [owned] = await getDatabase()
    .select({ id: userConnections.id })
    .from(userConnections)
    .innerJoin(connectorDefinitions, eq(userConnections.connectorId, connectorDefinitions.id))
    .where(and(eq(userConnections.id, input.connectionId), eq(userConnections.userId, userId)))
    .limit(1);
  if (!owned) throw new AppError(404, "CONNECTION_NOT_FOUND", "Connection not found.");
  return evaluateEffectiveAccess(input);
};
