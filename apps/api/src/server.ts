import { buildApp } from "@/app";
import { closeDatabase } from "@/db/client";
import { closeUpstreamClients } from "@/modules/mcp/upstream/client-manager";
import { env } from "@/lib/config/env";
import { databaseConfigured } from "@/lib/config/env";

const app = await buildApp();

const shutdown = async (): Promise<void> => {
  await closeUpstreamClients();
  await app.close();
  await closeDatabase();
};

process.on("SIGINT", () => {
  void shutdown().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().then(() => process.exit(0));
});

await app.listen({ port: env.PORT, host: env.HOST });
app.log.info(
  { port: env.PORT, host: env.HOST, databaseConfigured },
  "AgentVault API listening.",
);
