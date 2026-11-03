import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const connectorDefinitions = pgTable("connector_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
});
