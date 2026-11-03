import { SignJWT, jwtVerify } from "jose";

import type { DashboardSession } from "@agentvault/shared";

import { env } from "@/lib/config/env";
import { AppError, NotImplementedError } from "@/lib/errors/app-error";

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

export const rotateRefreshToken = async (_refreshToken: string): Promise<DashboardSession> => {
  throw new NotImplementedError(
    "Refresh token rotation is not implemented.",
    "TODO(AUTH): Validate the refresh token, rotate it, and issue a new dashboard session.",
  );
};
