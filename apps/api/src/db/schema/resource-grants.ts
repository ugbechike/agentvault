import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { userConnections } from "./connections";

export const agentResourceGrants = pgTable(
  "agent_resource_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => userConnections.id, { onDelete: "cascade" }),
    resourceKey: text("resource_key").notNull(),
    access: text("access").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("agent_resource_grants_agent_connection_key_idx").on(
      table.agentId,
      table.connectionId,
      table.resourceKey,
    ),
  ],
);
