import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "@/app";
import { issueAgentToken, sha256 } from "@/lib/crypto/sha256";
import { userRepository } from "@/modules/auth/repositories/user.repository";
import { passwordHasher } from "@/modules/auth/services/password.service";

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

  it("reports the mounted MCP server", async () => {
    app = await buildApp();
    const base = await listen(app);
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; checks: { downstreamMcp: string; permissionEnforcement: string } };
    expect(body.status).toBe("ok");
    expect(body.checks.downstreamMcp).toBe("mounted");
    expect(body.checks.permissionEnforcement).toBe("implemented");
  });
});

describe("protected routes", () => {
  let app: FastifyInstance | undefined;
  let base = "";

  afterEach(async () => {
    await app?.close();
  });

  const start = async () => {
    app = await buildApp();
    base = await listen(app);
  };

  it("rejects an invalid login before looking up an account", async () => {
    await start();
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short" }),
    });
    expect(response.status).toBe(400);
  });

  it("does not accept an unknown password", async () => {
    await start();
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "nobody@agentvault.dev", password: "vault-demo-password" }),
    });
    expect([401, 500, 503]).toContain(response.status);
    if (response.status === 401) {
      const body = (await response.json()) as { error: { code: string } };
      expect(body.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects anonymous MCP access", async () => {
    await start();
    const response = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    expect(response.status).toBe(401);
  });

  it("rejects anonymous permission evaluation", async () => {
    await start();
    const response = await fetch(`${base}/api/permissions/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "00000000-0000-4000-8000-000000000001",
        connectionId: "00000000-0000-4000-8000-000000000002",
        toolName: "github_write_issue",
        capability: "github.write",
      }),
    });
    expect(response.status).toBe(401);
  });

  it("rejects public registration", async () => {
    await start();
    const response = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Public User", email: "public@example.com", password: "correct-horse-battery" }),
    });
    expect(response.status).toBe(403);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("REGISTRATION_DISABLED");
  });

  it("lists no tools and audits a denied call for an agent without a provider", async () => {
    await start();
    const email = `mcp-${Date.now()}@example.com`;
    const password = "correct-horse-battery";
    await userRepository.create({
      email,
      name: "MCP Tester",
      passwordHash: await passwordHasher.hash(password),
    });
    const signedIn = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(signedIn.status).toBe(200);
    const session = (await signedIn.json()) as { accessToken: string };
    const created = await fetch(`${base}/api/agents`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({ name: "My Cursor", description: "Verification", clientKind: "cursor" }),
    });
    expect(created.status).toBe(200);
    const agent = (await created.json()) as { agent: { id: string }; credential: { token: string } };
    const headers = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${agent.credential.token}`,
    };
    const listed = await fetch(`${base}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
    });
    expect(listed.status).toBe(200);
    const listedBody = await listed.text();
    expect(listedBody).toContain('"tools":[]');
    const called = await fetch(`${base}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "github_write_issue", arguments: { owner: "octocat", repo: "hello", method: "create" } },
      }),
    });
    expect(called.status).toBe(200);
    const calledBody = await called.text();
    expect(calledBody).toContain("isError");
    const audit = await fetch(`${base}/api/audit`, {
      headers: { authorization: `Bearer ${session.accessToken}` },
    });
    expect(audit.status).toBe(200);
    const logs = (await audit.json()) as Array<{ toolName: string; status: string; decision: string }>;
    expect(logs.some((item) => item.toolName === "github_write_issue" && item.status === "denied" && item.decision === "deny")).toBe(true);
    const revoked = await fetch(`${base}/api/agents/${agent.agent.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${session.accessToken}` },
    });
    expect(revoked.status).toBe(200);
    const afterRevoke = await fetch(`${base}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: 4, method: "tools/list", params: {} }),
    });
    expect(afterRevoke.status).toBe(401);
  });

  it("does not connect GitHub from a shared environment token", async () => {
    await start();
    const response = await fetch(`${base}/api/connections`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer not-a-session" },
      body: JSON.stringify({ provider: "github" }),
    });
    expect([400, 401]).toContain(response.status);
  });
});

describe("mcp credentials", () => {
  it("issues a token that is not the agent id", () => {
    const issued = issueAgentToken();
    expect(issued.token.startsWith("avmcp_")).toBe(true);
    expect(issued.tokenHash).toBe(sha256(issued.token));
    expect(issued.tokenHash).not.toBe(issued.token);
    expect(issued.token).not.toMatch(/^[0-9a-f-]{36}$/i);
  });
});
