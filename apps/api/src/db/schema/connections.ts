import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { connectorDefinitions } from "./connectors";
import { users } from "./users";

/**
 * encrypted_credential_reference is an opaque pointer to a secret store.
 * Do not write OAuth access tokens, refresh tokens, or PATs into this column.
 */
export const userConnections = pgTable(
  "user_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    connectorId: uuid("connector_id")
      .notNull()
      .references(() => connectorDefinitions.id, { onDelete: "restrict" }),
    providerAccountId: text("provider_account_id"),
    encryptedCredentialReference: text("encrypted_credential_reference"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_connections_user_connector_idx").on(table.userId, table.connectorId)],
);
