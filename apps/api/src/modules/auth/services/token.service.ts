import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";

import type { DashboardSession } from "@agentvault/shared";

import { getDatabase } from "@/db/client";
import { refreshTokens } from "@/db/schema";
import { env } from "@/lib/config/env";
import { sha256 } from "@/lib/crypto/sha256";
import { AppError } from "@/lib/errors/app-error";

export interface AccessTokenClaims {
  sub: string;
  email: string;
}

const accessTtlSeconds = 60 * 60;
const refreshTtlSeconds = 60 * 60 * 24 * 14;

const signingKey = (): Uint8Array => {
  if (!env.JWT_SECRET) {
    throw new AppError(503, "JWT_SECRET_MISSING", "JWT_SECRET is not set.");
  }
  return new TextEncoder().encode(env.JWT_SECRET);
};

const signToken = async (
  userId: string,
  email: string,
  use: "access" | "refresh",
  ttlSeconds: number,
): Promise<string> => {
  return new SignJWT({ email, use })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(signingKey());
};

export const issueDashboardSession = async (userId: string, email: string): Promise<DashboardSession> => {
  const accessToken = await signToken(userId, email, "access", accessTtlSeconds);
  const refreshToken = await signToken(userId, email, "refresh", refreshTtlSeconds);
  await getDatabase().insert(refreshTokens).values({
    userId,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
  });
  return {
    userId,
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + accessTtlSeconds * 1000).toISOString(),
  };
};

export const verifyAccessToken = async (token: string | undefined): Promise<AccessTokenClaims> => {
  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "Missing dashboard access token.");
  }
  try {
    const { payload } = await jwtVerify(token, signingKey());
    if (payload.use !== "access" || typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new AppError(401, "UNAUTHORIZED", "Dashboard access token was rejected.");
    }
    return { sub: payload.sub, email: payload.email };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, "UNAUTHORIZED", "Dashboard access token was rejected.");
  }
};

export const rotateRefreshToken = async (refreshToken: string): Promise<DashboardSession> => {
  let userId = "";
  let email = "";
  try {
    const { payload } = await jwtVerify(refreshToken, signingKey());
    if (payload.use !== "refresh" || typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new Error("rejected");
    }
    userId = payload.sub;
    email = payload.email;
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Refresh token was rejected.");
  }
  const tokenHash = sha256(refreshToken);
  const [row] = await getDatabase()
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);
  if (!row || row.revokedAt || row.expiresAt.getTime() < Date.now() || row.userId !== userId) {
    throw new AppError(401, "UNAUTHORIZED", "Refresh token was rejected.");
  }
  await getDatabase().update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, row.id));
  return issueDashboardSession(userId, email);
};

export const revokeUserRefreshTokens = async (userId: string): Promise<void> => {
  await getDatabase()
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));
};
