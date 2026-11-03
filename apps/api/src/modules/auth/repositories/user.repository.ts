import { eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { users } from "@/db/schema";
import { AppError } from "@/lib/errors/app-error";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRecord {
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: CreateUserRecord): Promise<UserRecord>;
}

const toRecord = (row: typeof users.$inferSelect): UserRecord => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const userRepository: UserRepository = {
  findByEmail: async (email) => {
    const [row] = await getDatabase()
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ? toRecord(row) : null;
  },
  findById: async (id) => {
    const [row] = await getDatabase().select().from(users).where(eq(users.id, id)).limit(1);
    return row ? toRecord(row) : null;
  },
  create: async (input) => {
    const [row] = await getDatabase()
      .insert(users)
      .values({
        email: input.email,
        passwordHash: input.passwordHash,
      })
      .returning();
    if (!row) {
      throw new AppError(500, "USER_CREATE_FAILED", "The account could not be created.");
    }
    return toRecord(row);
  },
};
