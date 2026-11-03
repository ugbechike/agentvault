import { illustrativeAllowlist, type MappedAgentVaultTool } from "@agentvault/shared";

import { getDatabase } from "@/db/client";
import { agentPermissions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const filterToolsForAgent = async (
  agentId: string,
  tools: readonly MappedAgentVaultTool[],
): Promise<readonly MappedAgentVaultTool[]> => {
  const permissions = await getDatabase()
  .select()
  .from(agentPermissions)
  .where(and(eq(agentPermissions.agentId, agentId), eq(agentPermissions.allowed, true)));
return tools.filter((tool) => {
  const entry = illustrativeAllowlist.find((item) => item.agentvaultName === tool.agentvaultName);
  if (!entry) return false;
  return permissions.some(
    (permission) => permission.connectionId === tool.connectionId && permission.capability === entry.requiredCapability,
  );
});
};
