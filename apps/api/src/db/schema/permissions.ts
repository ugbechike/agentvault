import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { userConnections } from "./connections";

export const agentPermissions = pgTable(
  "agent_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => userConnections.id, { onDelete: "cascade" }),
    capability: text("capability").notNull(),
    allowed: boolean("allowed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("agent_permissions_agent_connection_capability_idx").on(
      table.agentId,
      table.connectionId,
      table.capability,
    ),
  ],
);
