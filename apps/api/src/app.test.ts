import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "@/app";
import { NotImplementedError } from "@/lib/errors/app-error";
import { githubAdapter } from "@/modules/connectors/adapters/github/github.adapter";
import { evaluateEffectiveAccess } from "@/modules/permissions/policies/effective-access";

const listen = async (app: FastifyInstance): Promise<string> => {
  await app.listen({ port: 0, host: "127.0.0.1" });
  const address = app.server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind a TCP port.");
  }
  return `http://127.0.0.1:${address.port}`;
};

describe("health", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("returns ok without a database or MCP server", async () => {
    app = await buildApp();
    const base = await listen(app);
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; checks: { downstreamMcp: string } };
    expect(body.status).toBe("ok");
    expect(body.checks.downstreamMcp).toBe("not_implemented");
  });
});

describe("unimplemented routes", () => {
  let app: FastifyInstance | undefined;
  let base = "";

  afterEach(async () => {
    await app?.close();
  });

  const start = async () => {
    app = await buildApp();
    base = await listen(app);
  };

  it("rejects an invalid login before the unimplemented service", async () => {
    await start();
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns database not configured for a valid login when no database is set", async () => {
    await start();
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "ada@agentvault.dev", password: "vault-demo" }),
    });
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("DATABASE_NOT_CONFIGURED");
  });

  it("returns 501 for the MCP endpoint", async () => {
    await start();
    const response = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(501);
  });

  it("returns 501 for permission evaluation", async () => {
    await start();
    const response = await fetch(`${base}/api/permissions/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agt_cursor",
        connectionId: "con_github",
        toolName: "github_create_issue",
        capability: "github.write",
      }),
    });
    expect(response.status).toBe(501);
  });
});

describe("fail closed boundaries", () => {
  it("does not allow a tool call when evaluation is unimplemented", async () => {
    await expect(
      evaluateEffectiveAccess({
        agentId: "agt_cursor",
        connectionId: "con_github",
        toolName: "github_list_repositories",
        capability: "github.read",
      }),
    ).rejects.toBeInstanceOf(NotImplementedError);
  });

  it("does not discover GitHub tools without a database", async () => {
    await expect(
      githubAdapter.discoverTools({ connectionId: "con_github", provider: "github" }),
    ).rejects.toMatchObject({ code: "DATABASE_NOT_CONFIGURED" });
  });
});
