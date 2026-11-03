import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { userConnections } from "./connections";

/** AES-GCM ciphertext of the provider token payload. The connection row stores only this id. */
export const connectionSecrets = pgTable("connection_secrets", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectionId: uuid("connection_id")
    .notNull()
    .unique()
    .references(() => userConnections.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
