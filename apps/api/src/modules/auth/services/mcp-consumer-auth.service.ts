import type { McpConsumerIdentity } from "@agentvault/shared";
import { eq } from "drizzle-orm";

import { agents } from "@/db/schema";
import { getDatabase } from "@/db/client";
import { AppError } from "@/lib/errors/app-error";
const bearerPattern = /^Bearer\s+(\S+)$/i;

export const authenticateMcpConsumer = async (
  authorizationHeader: string | undefined,
): Promise<McpConsumerIdentity> => {
  const token = authorizationHeader?.match(bearerPattern)?.[1];
  if (!token){
    throw new AppError(401, "UNAUTHORIZED", "Missing MCP bearer token.");
  }

  const [agent] = await getDatabase()
  .select()
  .from(agents)
  .where(eq(agents.id, token))
  .limit(1);

  if (!agent || agent.status !== "active"){
    throw new AppError(401, "UNAUTHORIZED", "MCP credential was rejected.");
  }

  return {
    agentId: agent.id,
    userId: agent.userId,
    credentialId: agent.id,
  }

 
};
