import type { CapabilityId, CreateConnectionInput, ProviderId } from "@agentvault/shared";
import { capabilityIds } from "@agentvault/shared";
import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { connectorDefinitions, discoveredTools, userConnections } from "@/db/schema";
import { AppError } from "@/lib/errors/app-error";
import { getConnectorAdapter } from "@/modules/connectors/registry/connector-registry";
import { revokeDemoCredential } from "@/modules/connectors/oauth/demo-oauth";
import { assertPublicDemoProvider } from "@/modules/connectors/public-demo";
import { deleteConnectionCredential, deleteStoredSecret } from "@/modules/connectors/services/credential-store";

const asCapabilities = (value: unknown): CapabilityId[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CapabilityId => capabilityIds.includes(item as CapabilityId));
};

export interface LoadedConnection {
  id: string;
  userId: string;
  provider: ProviderId;
  providerAccountId: string | null;
  encryptedCredentialReference: string | null;
  status: string;
  statusDetail: string | null;
  grantedCapabilities: CapabilityId[];
  readOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
  tools: (typeof discoveredTools.$inferSelect)[];
}

const publicConnection = (connection: LoadedConnection) => ({
  id: connection.id,
  provider: connection.provider,
  providerAccountId: connection.providerAccountId,
  status: connection.status,
  statusDetail: connection.statusDetail,
  grantedCapabilities: connection.grantedCapabilities,
  readOnly: connection.readOnly,
  createdAt: connection.createdAt,
  updatedAt: connection.updatedAt,
  tools: connection.tools.map((tool) => ({
    id: tool.id,
    upstreamToolName: tool.upstreamToolName,
    description: tool.description,
    inputSchema: tool.inputSchema,
    requiredCapability: tool.requiredCapability,
    enabled: tool.enabled,
  })),
});

export const listConnectors = async () => getDatabase().select().from(connectorDefinitions);

export const getConnector = async (provider: ProviderId, userId: string) => {
  const db = getDatabase();
  const [definition] = await db
    .select()
    .from(connectorDefinitions)
    .where(eq(connectorDefinitions.provider, provider))
    .limit(1);
  if (!definition) {
    throw new AppError(404, "CONNECTOR_NOT_FOUND", `Connector ${provider} was not found.`);
  }
  const connections = await listConnections(userId);
  return { ...definition, connections: connections.filter((connection) => connection.provider === provider) };
};

export const listConnections = async (userId: string) => {
  const rows = await getDatabase()
    .select({
      id: userConnections.id,
      provider: connectorDefinitions.provider,
      providerAccountId: userConnections.providerAccountId,
      status: userConnections.status,
      statusDetail: userConnections.statusDetail,
      grantedCapabilities: userConnections.grantedCapabilities,
      readOnly: userConnections.readOnly,
      createdAt: userConnections.createdAt,
      updatedAt: userConnections.updatedAt,
    })
    .from(userConnections)
    .innerJoin(connectorDefinitions, eq(userConnections.connectorId, connectorDefinitions.id))
    .where(eq(userConnections.userId, userId));
  return rows.map((row) => ({
    ...row,
    provider: row.provider as ProviderId,
    grantedCapabilities: asCapabilities(row.grantedCapabilities),
  }));
};

export const createConnection = async (_userId: string, input: CreateConnectionInput): Promise<never> => {
  assertPublicDemoProvider(input.provider);
  throw new AppError(400, "OAUTH_REQUIRED", "Demo connections start from the Connect Demo Provider action.");
};

const loadConnection = async (connectionId: string): Promise<LoadedConnection> => {
  const db = getDatabase();
  const [row] = await db
    .select({ connection: userConnections, provider: connectorDefinitions.provider })
    .from(userConnections)
    .innerJoin(connectorDefinitions, eq(userConnections.connectorId, connectorDefinitions.id))
    .where(eq(userConnections.id, connectionId))
    .limit(1);
  if (!row) throw new AppError(404, "CONNECTION_NOT_FOUND", "Connection not found.");
  const tools = await db.select().from(discoveredTools).where(eq(discoveredTools.connectionId, connectionId));
  return {
    id: row.connection.id,
    userId: row.connection.userId,
    provider: row.provider as ProviderId,
    providerAccountId: row.connection.providerAccountId,
    encryptedCredentialReference: row.connection.encryptedCredentialReference,
    status: row.connection.status,
    statusDetail: row.connection.statusDetail,
    grantedCapabilities: asCapabilities(row.connection.grantedCapabilities),
    readOnly: row.connection.readOnly,
    createdAt: row.connection.createdAt,
    updatedAt: row.connection.updatedAt,
    tools,
  };
};

export const getConnection = async (connectionId: string): Promise<LoadedConnection> => loadConnection(connectionId);

export const getOwnedConnection = async (userId: string, connectionId: string) => {
  const connection = await loadConnection(connectionId);
  if (connection.userId !== userId) {
    throw new AppError(404, "CONNECTION_NOT_FOUND", "Connection not found.");
  }
  return publicConnection(connection);
};

export const setConnectionStatus = async (
  connectionId: string,
  status: "connected" | "error" | "disconnected" | "pending",
  statusDetail: string | null,
): Promise<void> => {
  await getDatabase()
    .update(userConnections)
    .set({ status, statusDetail, updatedAt: new Date() })
    .where(eq(userConnections.id, connectionId));
};

export const deleteConnection = async (userId: string, connectionId: string) => {
  const connection = await loadConnection(connectionId);
  if (connection.userId !== userId) {
    throw new AppError(404, "CONNECTION_NOT_FOUND", "Connection not found.");
  }
  if (connection.provider === "demo") {
    const adapter = getConnectorAdapter(connection.provider);
    await adapter.disconnect({ connectionId: connection.id, provider: connection.provider });
    const credential = await deleteConnectionCredential(connection.id);
    if (credential) await revokeDemoCredential(credential);
  } else {
    const { disconnectUpstream } = await import("@/modules/mcp/upstream/client-manager");
    await disconnectUpstream(connection.id);
    await deleteStoredSecret(connection.id);
  }
  const [updated] = await getDatabase()
    .update(userConnections)
    .set({
      status: "disconnected",
      statusDetail: null,
      encryptedCredentialReference: null,
      grantedCapabilities: [],
      updatedAt: new Date(),
    })
    .where(and(eq(userConnections.id, connectionId), eq(userConnections.userId, userId)))
    .returning({ id: userConnections.id, status: userConnections.status });
  return updated;
};

export const validateConnection = async (userId: string, connectionId: string) => {
  const connection = await loadConnection(connectionId);
  if (connection.userId !== userId) {
    throw new AppError(404, "CONNECTION_NOT_FOUND", "Connection not found.");
  }
  assertPublicDemoProvider(connection.provider);
  if (!connection.encryptedCredentialReference) {
    throw new AppError(400, "CREDENTIAL_MISSING", "This connection has no stored credential.");
  }
  const adapter = getConnectorAdapter(connection.provider);
  return adapter.validateConnection({
    connectionId: connection.id,
    provider: connection.provider,
    endpoint: adapter.remoteMcpEndpoint,
    credentialReference: connection.encryptedCredentialReference,
  });
};
