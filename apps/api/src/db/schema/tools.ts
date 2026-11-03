import { boolean, jsonb, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { userConnections } from "./connections";

export const discoveredTools = pgTable(
  "discovered_tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => userConnections.id, { onDelete: "cascade" }),
    upstreamToolName: text("upstream_tool_name").notNull(),
    description: text("description").notNull().default(""),
    inputSchema: jsonb("input_schema").notNull(),
    requiredCapability: text("required_capability").notNull(),
    enabled: boolean("enabled").notNull().default(false),
  },
  (table) => [
    uniqueIndex("discovered_tools_connection_name_idx").on(table.connectionId, table.upstreamToolName),
  ],
);
