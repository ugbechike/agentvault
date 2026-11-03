import type { AgentClientKind, AgentRecord, CreateAgentInput, UpdateAgentInput } from "@agentvault/shared";
import { and, desc, eq, isNull } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { agentCredentials, agentPermissions, agents } from "@/db/schema";
import { issueAgentToken } from "@/lib/crypto/sha256";
import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";

const isClientKind = (value: string): value is AgentClientKind =>
  value === "cursor" || value === "claude-code" || value === "custom";

const toRecord = (row: typeof agents.$inferSelect): AgentRecord => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  description: row.description,
  clientKind: isClientKind(row.clientKind) ? row.clientKind : "custom",
  status: row.status === "revoked" ? "revoked" : "active",
  createdAt: row.createdAt.toISOString(),
});

const requireOwned = async (userId: string, agentId: string) => {
  const [agent] = await getDatabase()
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.userId, userId)))
    .limit(1);
  if (!agent) throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
  return agent;
};

const issueCredential = async (agentId: string) => {
  const issued = issueAgentToken();
  const [credential] = await getDatabase()
    .insert(agentCredentials)
    .values({ agentId, tokenHash: issued.tokenHash, tokenPrefix: issued.tokenPrefix })
    .returning({ id: agentCredentials.id, tokenPrefix: agentCredentials.tokenPrefix });
  if (!credential) throw new AppError(500, "CREDENTIAL_ISSUE_FAILED", "The MCP credential could not be issued.");
  return {
    credentialId: credential.id,
    token: issued.token,
    tokenPrefix: credential.tokenPrefix,
    mcpEndpoint: `${env.API_PUBLIC_URL.replace(/\/$/, "")}/mcp`,
  };
};

export const listAgents = async (userId: string) => {
  const rows = await getDatabase()
    .select()
    .from(agents)
    .where(eq(agents.userId, userId))
    .orderBy(desc(agents.createdAt));
  const credentials = await getDatabase()
    .select({
      agentId: agentCredentials.agentId,
      id: agentCredentials.id,
      tokenPrefix: agentCredentials.tokenPrefix,
      revokedAt: agentCredentials.revokedAt,
      createdAt: agentCredentials.createdAt,
      lastUsedAt: agentCredentials.lastUsedAt,
    })
    .from(agentCredentials)
    .innerJoin(agents, eq(agentCredentials.agentId, agents.id))
    .where(and(eq(agents.userId, userId), isNull(agentCredentials.revokedAt)));
  return rows.map((row) => ({
    ...toRecord(row),
    credentials: credentials
      .filter((credential) => credential.agentId === row.id)
      .map((credential) => ({
        id: credential.id,
        tokenPrefix: credential.tokenPrefix,
        createdAt: credential.createdAt.toISOString(),
        lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
      })),
  }));
};

export const createAgent = async (userId: string, input: CreateAgentInput) => {
  const [created] = await getDatabase()
    .insert(agents)
    .values({
      userId,
      name: input.name,
      description: input.description,
      clientKind: input.clientKind,
      status: "active",
    })
    .returning();
  if (!created) throw new AppError(500, "AGENT_CREATE_FAILED", "The agent could not be registered.");
  const credential = await issueCredential(created.id);
  return { agent: toRecord(created), credential };
};

export const getAgent = async (userId: string, agentId: string) => {
  const agent = await requireOwned(userId, agentId);
  const permissions = await getDatabase().select().from(agentPermissions).where(eq(agentPermissions.agentId, agentId));
  const listed = await listAgents(userId);
  const summary = listed.find((item) => item.id === agentId);
  return {
    ...toRecord(agent),
    credentials: summary?.credentials ?? [],
    permissions: permissions.map((permission) => ({
      id: permission.id,
      connectionId: permission.connectionId,
      capability: permission.capability,
      allowed: permission.allowed,
    })),
  };
};

export const updateAgent = async (userId: string, agentId: string, input: UpdateAgentInput) => {
  await requireOwned(userId, agentId);
  const [updated] = await getDatabase()
    .update(agents)
    .set({
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    })
    .where(and(eq(agents.id, agentId), eq(agents.userId, userId)))
    .returning();
  if (!updated) throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
  return toRecord(updated);
};

export const revokeAgent = async (userId: string, agentId: string) => {
  await requireOwned(userId, agentId);
  const now = new Date();
  await getDatabase()
    .update(agentCredentials)
    .set({ revokedAt: now })
    .where(and(eq(agentCredentials.agentId, agentId), isNull(agentCredentials.revokedAt)));
  await getDatabase()
    .update(agentPermissions)
    .set({ allowed: false })
    .where(eq(agentPermissions.agentId, agentId));
  const [updated] = await getDatabase()
    .update(agents)
    .set({ status: "revoked" })
    .where(and(eq(agents.id, agentId), eq(agents.userId, userId)))
    .returning();
  if (!updated) throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
  return toRecord(updated);
};

export const rotateAgentCredential = async (userId: string, agentId: string) => {
  const agent = await requireOwned(userId, agentId);
  if (agent.status !== "active") {
    throw new AppError(409, "AGENT_REVOKED", "Revoked agents cannot receive a new credential.");
  }
  const now = new Date();
  await getDatabase()
    .update(agentCredentials)
    .set({ revokedAt: now })
    .where(and(eq(agentCredentials.agentId, agentId), isNull(agentCredentials.revokedAt)));
  return issueCredential(agentId);
};
