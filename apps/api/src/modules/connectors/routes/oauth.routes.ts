import { z } from "zod";
import type { FastifyInstance } from "fastify";

import { env } from "@/lib/config/env";
import * as authService from "@/modules/auth/services/auth.service";
import { beginDemoAuthorization, completeDemoAuthorization } from "@/modules/connectors/oauth/demo-oauth";
import { assertPublicDemoProvider } from "@/modules/connectors/public-demo";
import { syncDiscoveredTools } from "@/modules/mcp/upstream/tool-discovery";

const callbackQuery = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

const demoRedirect = (status: "connected" | "error"): string =>
  `${env.WEB_ORIGIN.replace(/\/$/, "")}/connectors/demo?oauth=${status}`;

export const registerOauthRoutes = (app: FastifyInstance): void => {
  app.post("/api/oauth/demo/start", async (request) => {
    const userId = await authService.readSession(request.headers.authorization);
    assertPublicDemoProvider("demo");
    return beginDemoAuthorization(userId);
  });

  app.get("/api/oauth/demo/callback", async (request, reply) => {
    const parsed = callbackQuery.safeParse(request.query);
    if (!parsed.success) return reply.redirect(demoRedirect("error"));
    try {
      const completed = await completeDemoAuthorization(parsed.data.code, parsed.data.state);
      await syncDiscoveredTools(completed.connectionId);
      return reply.redirect(demoRedirect("connected"));
    } catch {
      return reply.redirect(demoRedirect("error"));
    }
  });

  app.post("/api/oauth/github/start", async (request) => {
    await authService.readSession(request.headers.authorization);
    assertPublicDemoProvider("github");
  });

  app.post("/api/oauth/supabase/start", async (request) => {
    await authService.readSession(request.headers.authorization);
    assertPublicDemoProvider("supabase");
  });
};
