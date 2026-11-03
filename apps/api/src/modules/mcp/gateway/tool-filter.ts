import { illustrativeAllowlist, type MappedAgentVaultTool } from "@agentvault/shared";

import { getDatabase } from "@/db/client";
import { agentPermissions, agentToolPolicies } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const filterToolsForAgent = async (
  agentId: string,
  tools: readonly MappedAgentVaultTool[],
): Promise<readonly MappedAgentVaultTool[]> => {
  const db = getDatabase();
  const permissions = await db
    .select()
    .from(agentPermissions)
    .where(and(eq(agentPermissions.agentId, agentId), eq(agentPermissions.allowed, true)));
  const policies = await db.select().from(agentToolPolicies).where(eq(agentToolPolicies.agentId, agentId));
  return tools.filter((tool) => {
    const entry = illustrativeAllowlist.find((item) => item.agentvaultName === tool.agentvaultName);
    if (!entry) return false;
    const permitted = permissions.some(
      (permission) => permission.connectionId === tool.connectionId && permission.capability === entry.requiredCapability,
    );
    if (!permitted) return false;
    const policy = policies.find((item) => item.toolName === entry.agentvaultName);
    return !policy || policy.allowed;
  });
};
