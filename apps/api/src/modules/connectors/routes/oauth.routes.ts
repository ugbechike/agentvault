import { z } from "zod";
import type { FastifyInstance } from "fastify";

import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";
import * as authService from "@/modules/auth/services/auth.service";
import { beginGithubAuthorization, completeGithubAuthorization } from "@/modules/connectors/oauth/github-oauth";
import { syncDiscoveredTools } from "@/modules/mcp/upstream/tool-discovery";

const callbackQuery = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

const githubRedirect = (status: "connected" | "error"): string =>
  `${env.WEB_ORIGIN.replace(/\/$/, "")}/connectors/github?oauth=${status}`;

export const registerOauthRoutes = (app: FastifyInstance): void => {
  app.post("/api/oauth/github/start", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    return beginGithubAuthorization(userId);
  });

  app.get("/api/oauth/github/callback", async (request, reply) => {
    const parsed = callbackQuery.safeParse(request.query);
    if (!parsed.success) return reply.redirect(githubRedirect("error"));
    try {
      const completed = await completeGithubAuthorization(parsed.data.code, parsed.data.state);
      await syncDiscoveredTools(completed.connectionId);
      return reply.redirect(githubRedirect("connected"));
    } catch {
      return reply.redirect(githubRedirect("error"));
    }
  });

  app.post("/api/oauth/supabase/start", async (request) => {
    await authService.readSession(request.headers.authorization);
    throw new AppError(
      503,
      "SUPABASE_OAUTH_UNAVAILABLE",
      "Supabase authorization is not configured. The connector stays disconnected, and SQL execution is not exposed.",
    );
  });
};
