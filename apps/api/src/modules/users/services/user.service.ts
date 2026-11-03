import type { ChangePasswordInput, UpdateProfileInput, UserProfile } from "@agentvault/shared";
import { eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { users } from "@/db/schema";
import { AppError } from "@/lib/errors/app-error";
import { userRepository } from "@/modules/auth/repositories/user.repository";
import { passwordHasher } from "@/modules/auth/services/password.service";

const toProfile = (user: { id: string; email: string; name: string; createdAt: Date }): UserProfile => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt.toISOString(),
});

export const getCurrentUser = async (userId: string): Promise<UserProfile> => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(401, "UNAUTHORIZED", "The signed-in account was not found.");
  return toProfile(user);
};

export const updateCurrentUser = async (userId: string, input: UpdateProfileInput): Promise<UserProfile> => {
  const email = input.email.toLowerCase();
  const existing = await userRepository.findByEmail(email);
  if (existing && existing.id !== userId) {
    throw new AppError(409, "EMAIL_TAKEN", "An account with that email already exists.");
  }
  const [updated] = await getDatabase()
    .update(users)
    .set({ email, name: input.name, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  if (!updated) throw new AppError(401, "UNAUTHORIZED", "The signed-in account was not found.");
  return toProfile(updated);
};

export const changePassword = async (userId: string, input: ChangePasswordInput): Promise<{ ok: true }> => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(401, "UNAUTHORIZED", "The signed-in account was not found.");
  const matches = await passwordHasher.verify(input.currentPassword, user.passwordHash);
  if (!matches) throw new AppError(401, "UNAUTHORIZED", "Current password is incorrect.");
  const passwordHash = await passwordHasher.hash(input.newPassword);
  await getDatabase().update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
  return { ok: true };
};
