import type { McpConsumerIdentity } from "@agentvault/shared";
import { and, eq, isNull } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { agentCredentials, agents } from "@/db/schema";
import { sha256 } from "@/lib/crypto/sha256";
import { AppError } from "@/lib/errors/app-error";

const bearerPattern = /^Bearer\s+(\S+)$/i;

export const authenticateMcpConsumer = async (
  authorizationHeader: string | undefined,
): Promise<McpConsumerIdentity> => {
  const token = authorizationHeader?.match(bearerPattern)?.[1];
  if (!token || token.split(".").length === 3) {
    throw new AppError(401, "UNAUTHORIZED", "Missing MCP bearer token.");
  }

  const tokenHash = sha256(token);
  const [row] = await getDatabase()
    .select({ credential: agentCredentials, agent: agents })
    .from(agentCredentials)
    .innerJoin(agents, eq(agentCredentials.agentId, agents.id))
    .where(and(eq(agentCredentials.tokenHash, tokenHash), isNull(agentCredentials.revokedAt)))
    .limit(1);

  const expired = row?.credential.expiresAt ? row.credential.expiresAt.getTime() < Date.now() : false;
  if (!row || row.agent.status !== "active" || expired) {
    throw new AppError(401, "UNAUTHORIZED", "MCP credential was rejected.");
  }

  await getDatabase()
    .update(agentCredentials)
    .set({ lastUsedAt: new Date() })
    .where(eq(agentCredentials.id, row.credential.id));

  return {
    agentId: row.agent.id,
    userId: row.agent.userId,
    credentialId: row.credential.id,
  };
};
