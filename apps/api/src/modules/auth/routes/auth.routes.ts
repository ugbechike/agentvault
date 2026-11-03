import { forgotPasswordSchema, loginSchema, refreshSessionSchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import { AppError } from "@/lib/errors/app-error";
import * as authService from "@/modules/auth/services/auth.service";

export const registerAuthRoutes = (app: FastifyInstance): void => {
  app.post("/api/auth/register", async () => {
    throw new AppError(403, "REGISTRATION_DISABLED", "Registration is not available. Sign in with a provided demo account.");
  });

  app.post("/api/auth/login", async (request) => {
    const body = loginSchema.parse(request.body);
    return authService.login(body);
  });

  app.post("/api/auth/logout", async (request) =>
    authService.logout(request.headers.authorization),
  );

  app.post("/api/auth/refresh", async (request) => {
    const body = refreshSessionSchema.parse(request.body);
    return authService.refresh(body);
  });

  app.post("/api/auth/forgot-password", async (request) => {
    const body = forgotPasswordSchema.parse(request.body);
    return authService.forgotPassword(body);
  });

  app.get("/api/auth/session", async (request) =>
    authService.readSession(request.headers.authorization),
  );
};
