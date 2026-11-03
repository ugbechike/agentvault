import type { CreateConnectionInput, ProviderId } from "@agentvault/shared";

import { AppError } from "@/lib/errors/app-error";
import { getConnectorAdapter } from "@/modules/connectors/registry/connector-registry";
import { getDatabase } from "@/db/client";
import { connectorDefinitions, discoveredTools, userConnections } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const listConnectors = async () => {
  return getDatabase().select().from(connectorDefinitions);
};

export const getConnector = async (provider: ProviderId) => {
  const db = getDatabase();
  const [definition] = await db
    .select()
    .from(connectorDefinitions)
    .where(eq(connectorDefinitions.provider, provider))
    .limit(1);
  if (!definition) {
    throw new AppError(404, "CONNECTOR_NOT_FOUND", `Connector ${provider} was not found.`);
  }
  const connections = await db
  .select()
  .from(userConnections)
  .where(eq(userConnections.connectorId, definition.id));
  return { ...definition, connections };
};

// listConnections is a helper function to list all connections for the signed-in user
export const listConnections = async (userId: string) => {
  return getDatabase()
    .select({
      id: userConnections.id,
      provider: connectorDefinitions.provider,
      providerAccountId: userConnections.providerAccountId,
      status: userConnections.status,
      createdAt: userConnections.createdAt,
      updatedAt: userConnections.updatedAt,
    })
    .from(userConnections)
    .innerJoin(connectorDefinitions, eq(userConnections.connectorId, connectorDefinitions.id))
    .where(eq(userConnections.userId, userId));
};

// Note: Asks the provider adapater to start authorization, then inserts one user_connections row.
// The credential column stores the env var name
// The token stays in .env. initializeConnection rejects a Supabase call that has no projectRef.
const credentialReferenceByProvider: Record<ProviderId, string> = {
  github: "GITHUB_MCP_TOKEN",
  supabase: "SUPABASE_MCP_TOKEN",
};
export const createConnection = async (userId: string, input: CreateConnectionInput) => {
  const adapter = getConnectorAdapter(input.provider);
  await adapter.initializeConnection({
    userId,
    provider: input.provider,
    projectRef: input.projectRef,
  });
  const db = getDatabase();
  const [definition] = await db
    .select()
    .from(connectorDefinitions)
    .where(eq(connectorDefinitions.provider, input.provider))
    .limit(1);
  if (!definition) {
    throw new AppError(404, "CONNECTOR_NOT_FOUND", `Connector ${input.provider} was not found.`);
  }

  const credentialReference = credentialReferenceByProvider[input.provider];
  const [existing] = await db
    .select()
    .from(userConnections)
    .where(and(eq(userConnections.userId, userId), eq(userConnections.connectorId, definition.id)))
    .limit(1);
  if (existing) {
    const [updated] = await db
      .update(userConnections)
      .set({
        status: "connected",
        providerAccountId: input.projectRef ?? existing.providerAccountId,
        encryptedCredentialReference: credentialReference,
        updatedAt: new Date(),
      })
      .where(eq(userConnections.id, existing.id))
      .returning();
    if (!updated) {
      throw new AppError(500, "CONNECTION_UPDATE_FAILED", "The connection could not be saved.");
    }
    return { id: updated.id, provider: input.provider, status: updated.status, providerAccountId: updated.providerAccountId };
  }

  const [created] = await db
    .insert(userConnections)
    .values({
      userId,
      connectorId: definition.id,
      providerAccountId: input.projectRef ?? null,
      encryptedCredentialReference: credentialReference,
      status: "connected",
    })
    .returning();
  if (!created) {
    throw new AppError(500, "CONNECTION_CREATE_FAILED", "The connection could not be saved.");
  }
  return { id: created.id, provider: input.provider, status: created.status, providerAccountId: created.providerAccountId };

};

// getConnection is a helper function to get a connection by id from the database
export const getConnection = async (connectionId: string) =>  {
  const db = getDatabase();
  const [row] = await db
    .select({ connection: userConnections, provider: connectorDefinitions.provider })
    .from(userConnections)
    .innerJoin(connectorDefinitions, eq(userConnections.connectorId, connectorDefinitions.id))
    .where(eq(userConnections.id, connectionId))
    .limit(1);

  if (!row) {
    throw new AppError(404, "CONNECTION_NOT_FOUND", `Connection ${connectionId} not found`);
  }

  const tools = await db
    .select()
    .from(discoveredTools)
    .where(eq(discoveredTools.connectionId, connectionId));

  return { ...row.connection, provider: row.provider as ProviderId, tools };
};

//Note: deleteConnection — closes the cached upstream client, then marks the row disconnected.
export const deleteConnection = async (connectionId: string) => {
  const connection = await getConnection(connectionId);
  const adapter = getConnectorAdapter(connection.provider);
  await adapter.disconnect({ connectionId: connection.id, provider: connection.provider });
  const [updated] = await getDatabase()
    .update(userConnections)
    .set({ status: "disconnected", updatedAt: new Date() })
    .where(eq(userConnections.id, connectionId))
    .returning();
  return updated;
};

/**
 * validateConnection — loads the row and asks that provider's adapter to discover tools. POST /api/connections/:id/validate currently skips this and calls syncDiscoveredTools directly.
 */
export const validateConnection = async (connectionId: string) => {
  const connection = await getConnection(connectionId);
  if (!connection.encryptedCredentialReference) {
    throw new AppError(400, "CREDENTIAL_MISSING", "This connection has no credential reference.");
  }
  const adapter = getConnectorAdapter(connection.provider);
  return adapter.validateConnection({
    connectionId: connection.id,
    provider: connection.provider,
    endpoint: adapter.remoteMcpEndpoint,
    credentialReference: connection.encryptedCredentialReference,
  });
};
