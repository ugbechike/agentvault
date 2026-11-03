import cors from "@fastify/cors";
import { sql } from "drizzle-orm";
import Fastify, { type FastifyInstance } from "fastify";

import { getDatabase } from "@/db/client";
import { databaseConfigured, env } from "@/lib/config/env";
import { registerErrorHandler } from "@/lib/errors/handler";
import { loggerOptions } from "@/lib/logger/logger";
import { registerAgentRoutes } from "@/modules/agents/routes/agents.routes";
import { registerAuditRoutes } from "@/modules/audit/routes/audit.routes";
import { registerAuthRoutes } from "@/modules/auth/routes/auth.routes";
import { registerConnectorRoutes } from "@/modules/connectors/routes/connectors.routes";
import { registerOauthRoutes } from "@/modules/connectors/routes/oauth.routes";
import { seedConnectorCatalog } from "@/modules/connectors/services/seed-connectors";
import { githubOauthConfigured } from "@/modules/connectors/oauth/github-oauth";
import { registerMcpPlaceholderRoutes } from "@/modules/mcp/routes";
import { registerPermissionRoutes } from "@/modules/permissions/routes/permissions.routes";
import { registerUserRoutes } from "@/modules/users/routes/users.routes";

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: loggerOptions,
    trustProxy: true,
  });

  registerErrorHandler(app);

  const webOrigin = new URL(env.WEB_ORIGIN);
  const localHosts =
    webOrigin.hostname === "localhost" || webOrigin.hostname === "127.0.0.1"
      ? ["localhost", "127.0.0.1"]
      : [webOrigin.hostname];
  const allowedOrigins = localHosts.map(
    (host) => `${webOrigin.protocol}//${host}${webOrigin.port ? `:${webOrigin.port}` : ""}`,
  );

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    // @fastify/cors defaults to GET,HEAD,POST. The dashboard also sends PUT, PATCH, and DELETE.
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
  });

  const databaseStatus = async (): Promise<string> => {
    if (!databaseConfigured) return "not_configured";
    try {
      await getDatabase().execute(sql`select 1`);
      return "ok";
    } catch {
      return "unreachable";
    }
  };

  app.get("/health", async () => ({
    status: "ok",
    service: "agentvault-api",
    mode: "poc",
    checks: {
      http: "ok",
      database: await databaseStatus(),
      downstreamMcp: "mounted",
      upstreamMcp: "implemented",
      auth: env.JWT_SECRET ? "configured" : "missing_jwt_secret",
      permissionEnforcement: "implemented",
      githubOauth: githubOauthConfigured() ? "configured" : "not_configured",
      supabaseOauth: env.SUPABASE_OAUTH_CLIENT_ID && env.SUPABASE_OAUTH_CLIENT_SECRET ? "configured" : "not_configured",
    },
  }));

  app.get("/", async () => ({
    service: "agentvault-api",
    mode: "poc",
    health: "/health",
    mcp: "/mcp",
  }));

  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerOauthRoutes(app);
  registerConnectorRoutes(app);
  registerAgentRoutes(app);
  registerPermissionRoutes(app);
  registerAuditRoutes(app);
  registerMcpPlaceholderRoutes(app);

  if (databaseConfigured) {
    try {
      await seedConnectorCatalog();
    } catch (error) {
      app.log.warn({ err: error }, "Connector catalog was not seeded.");
    }
  }

  return app;
};
