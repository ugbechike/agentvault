import {
  forgotPasswordSchema,
  loginSchema,
  refreshSessionSchema,
  registerSchema,
} from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as authService from "@/modules/auth/services/auth.service";

export const registerAuthRoutes = (app: FastifyInstance): void => {
  app.post("/api/auth/register", async (request) => {
    const body = registerSchema.parse(request.body);
    return authService.register(body);
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
