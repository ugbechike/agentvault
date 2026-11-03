import { connectorCatalog } from "@agentvault/shared";

import { getDatabase } from "@/db/client";
import { connectorDefinitions } from "@/db/schema";

export const seedConnectorCatalog = async (): Promise<void> => {
  const rows = connectorCatalog
    .filter((entry) => entry.provider === "demo" || entry.provider === "github" || entry.provider === "supabase")
    .map((entry) => ({
      provider: entry.provider,
      name: entry.name,
      description: entry.description,
      status: entry.status,
    }));
  await getDatabase()
    .insert(connectorDefinitions)
    .values(rows)
    .onConflictDoNothing({ target: connectorDefinitions.provider });
};
