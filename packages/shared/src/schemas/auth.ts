import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type RefreshSessionInput = z.infer<typeof refreshSessionSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
