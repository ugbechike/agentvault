import type {
  DashboardSession,
  ForgotPasswordInput,
  LoginInput,
  RefreshSessionInput,
  RegisterInput,
} from "@agentvault/shared";

import { AppError } from "@/lib/errors/app-error";
import { userRepository } from "@/modules/auth/repositories/user.repository";
import { passwordHasher } from "@/modules/auth/services/password.service";
import { issueDashboardSession, revokeUserRefreshTokens, rotateRefreshToken, verifyAccessToken } from "@/modules/auth/services/token.service";

const bearerPattern = /^Bearer\s+(\S+)$/i;
const invalidCredentials = (): AppError =>
  new AppError(401, "UNAUTHORIZED", "Email or password is incorrect.");

export const register = async (input: RegisterInput): Promise<{ email: string }> => {
  const email = input.email.toLowerCase();
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError(409, "EMAIL_TAKEN", "An account with that email already exists.");
  }
  const passwordHash = await passwordHasher.hash(input.password);
  const user = await userRepository.create({ email, name: input.name, passwordHash });
  return { email: user.email };
};

export const login = async (input: LoginInput): Promise<DashboardSession> => {
  const user = await userRepository.findByEmail(input.email.toLowerCase());
  if (!user) throw invalidCredentials();
  const matches = await passwordHasher.verify(input.password, user.passwordHash);
  if (!matches) throw invalidCredentials();
  return issueDashboardSession(user.id, user.email);
};

export const logout = async (authorizationHeader: string | undefined): Promise<{ ok: true }> => {
  const userId = await readSession(authorizationHeader);
  await revokeUserRefreshTokens(userId);
  return { ok: true };
};

export const refresh = async (input: RefreshSessionInput): Promise<DashboardSession> => rotateRefreshToken(input.refreshToken);

export const forgotPassword = async (_input: ForgotPasswordInput): Promise<{ ok: true }> => {
  return { ok: true };
};

export const readSession = async (authorizationHeader: string | undefined): Promise<string> => {
  const token = authorizationHeader?.match(bearerPattern)?.[1];
  const claims = await verifyAccessToken(token);
  return claims.sub;
};
