import { updateProfileSchema } from "@agentvault/shared";
import type { FastifyInstance } from "fastify";

import * as userService from "@/modules/users/services/user.service";

export const registerUserRoutes = (app: FastifyInstance): void => {
  app.get("/api/users/me", async () => {
    return userService.getCurrentUser("unauthenticated");
  });

  app.patch("/api/users/me", async (request) => {
    const body = updateProfileSchema.parse(request.body);
    return userService.updateCurrentUser("unauthenticated", body);
  });
};
