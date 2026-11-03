import { changePasswordSchema, updateProfileSchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as authService from "@/modules/auth/services/auth.service";
import * as userService from "@/modules/users/services/user.service";

export const registerUserRoutes = (app: FastifyInstance): void => {
  app.get("/api/users/me", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    return userService.getCurrentUser(userId);
  });

  app.patch("/api/users/me", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const body = updateProfileSchema.parse(request.body);
    return userService.updateCurrentUser(userId, body);
  });

  app.post("/api/users/me/password", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    const body = changePasswordSchema.parse(request.body);
    return userService.changePassword(userId, body);
  });
};
