import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { AppError } from "@/lib/errors/app-error";
import { env } from "@/lib/config/env";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let sql: ReturnType<typeof postgres> | null = null;
let database: Database | null = null;

/**
 * Opens a pool on first use. Importing this module does not connect.
 * The scaffold never calls this during boot or from the 501 routes.
 */
export const getDatabase = (): Database => {
  if (!env.DATABASE_URL) {
    throw new AppError(
      503,
      "DATABASE_NOT_CONFIGURED",
      "DATABASE_URL is not set. The API boots without a database; queries are not implemented.",
    );
  }

  if (!database || !sql) {
    sql = postgres(env.DATABASE_URL, { max: 1 });
    database = drizzle(sql, { schema });
  }

  return database;
};

export const closeDatabase = async (): Promise<void> => {
  if (!sql) {
    return;
  }
  await sql.end({ timeout: 1 });
  sql = null;
  database = null;
};
