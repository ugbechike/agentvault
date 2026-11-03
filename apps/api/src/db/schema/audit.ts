import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { userConnections } from "./connections";
import { users } from "./users";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  connectionId: uuid("connection_id")
    .notNull()
    .references(() => userConnections.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  decision: text("decision").notNull(),
  status: text("status").notNull(),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
