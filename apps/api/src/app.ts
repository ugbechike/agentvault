import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { databaseConfigured, env } from "@/lib/config/env";
import { registerErrorHandler } from "@/lib/errors/handler";
import { loggerOptions } from "@/lib/logger/logger";
import { registerAgentRoutes } from "@/modules/agents/routes/agents.routes";
import { registerAuditRoutes } from "@/modules/audit/routes/audit.routes";
import { registerAuthRoutes } from "@/modules/auth/routes/auth.routes";
import { registerConnectorRoutes } from "@/modules/connectors/routes/connectors.routes";
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
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "agentvault-api",
    mode: "scaffold",
    checks: {
      http: "ok",
      database: databaseConfigured ? "configured_not_checked" : "not_configured",
      downstreamMcp: "not_implemented",
      upstreamMcp: "not_implemented",
      auth: "not_implemented",
      permissionEnforcement: "not_implemented",
    },
  }));

  app.get("/", async () => ({
    service: "agentvault-api",
    mode: "scaffold",
    health: "/health",
    mcp: "/mcp",
  }));

  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerConnectorRoutes(app);
  registerAgentRoutes(app);
  registerPermissionRoutes(app);
  registerAuditRoutes(app);
  registerMcpPlaceholderRoutes(app);

  return app;
};
