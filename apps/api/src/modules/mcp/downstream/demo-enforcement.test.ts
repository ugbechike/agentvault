import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

const invokeUpstreamTool = vi.hoisted(() => vi.fn());

vi.mock("@/modules/mcp/upstream/tool-invocation", () => ({
  invokeUpstreamTool,
}));

import { buildApp } from "@/app";
import { getDatabase } from "@/db/client";
import { connectorDefinitions, discoveredTools, userConnections } from "@/db/schema";
import { userRepository } from "@/modules/auth/repositories/user.repository";
import { passwordHasher } from "@/modules/auth/services/password.service";

const listen = async (app: FastifyInstance): Promise<string> => {
  await app.listen({ port: 0, host: "127.0.0.1" });
  const address = app.server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port.");
  return `http://127.0.0.1:${address.port}`;
};

const mcpCall = (base: string, token: string, id: number, name: string) =>
  fetch(`${base}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name, arguments: name === "demo_echo" ? { message: "hello" } : { a: 1, b: 2 } },
    }),
  });

describe("demo permission enforcement", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("allows an authorized read, denies an ungranted tool before upstream, and isolates tenants", async () => {
    invokeUpstreamTool.mockReset();
    invokeUpstreamTool.mockResolvedValue({ content: [{ type: "text", text: "Echo: hello" }], isError: false });
    app = await buildApp();
    const base = await listen(app);
    const password = "correct-horse-battery";
    const email = `demo-owner-${Date.now()}@example.com`;
    const owner = await userRepository.create({
      email,
      name: "Owner",
      passwordHash: await passwordHasher.hash(password),
    });
    const otherEmail = `demo-other-${Date.now()}@example.com`;
    await userRepository.create({
      email: otherEmail,
      name: "Other",
      passwordHash: await passwordHasher.hash(password),
    });

    const signIn = async (account: string) => {
      const response = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: account, password }),
      });
      expect(response.status).toBe(200);
      return (await response.json()) as { accessToken: string };
    };

    const ownerSession = await signIn(email);
    const otherSession = await signIn(otherEmail);
    const auth = { authorization: `Bearer ${ownerSession.accessToken}`, "content-type": "application/json" };

    const [definition] = await getDatabase()
      .select()
      .from(connectorDefinitions)
      .where(eq(connectorDefinitions.provider, "demo"))
      .limit(1);
    if (!definition) throw new Error("Demo provider was not seeded.");
    const [connection] = await getDatabase()
      .insert(userConnections)
      .values({
        userId: owner.id,
        connectorId: definition.id,
        status: "connected",
        grantedCapabilities: ["demo.read"],
        readOnly: true,
        providerAccountId: "demo",
      })
      .returning();
    if (!connection) throw new Error("Connection was not created.");
    await getDatabase().insert(discoveredTools).values([
      {
        connectionId: connection.id,
        upstreamToolName: "echo",
        description: "Echoes back the input",
        inputSchema: { type: "object" },
        requiredCapability: "demo.read",
        enabled: true,
      },
      {
        connectionId: connection.id,
        upstreamToolName: "add",
        description: "Adds two numbers",
        inputSchema: { type: "object" },
        requiredCapability: "demo.read",
        enabled: true,
      },
    ]);

    const created = await fetch(`${base}/api/agents`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ name: "MCP Inspector", description: "Demo", clientKind: "custom" }),
    });
    expect(created.status).toBe(200);
    const agent = (await created.json()) as { agent: { id: string }; credential: { token: string } };
    const tools = ["demo_echo", "demo_add", "demo_get_tiny_image", "demo_annotated_message", "demo_get_resource_reference"].map(
      (toolName) => ({ toolName, allowed: toolName === "demo_echo" }),
    );
    const saved = await fetch(`${base}/api/agents/${agent.agent.id}/access`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ connectionId: connection.id, read: true, write: false, resources: [], tools }),
    });
    expect(saved.status).toBe(200);

    const listed = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${agent.credential.token}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    expect(listed.status).toBe(200);
    const listedBody = await listed.text();
    expect(listedBody).toContain("demo_echo");
    expect(listedBody).not.toContain("demo_add");

    const deniedAdd = await mcpCall(base, agent.credential.token, 2, "demo_add");
    expect(deniedAdd.status).toBe(200);
    expect(await deniedAdd.text()).toContain("isError");
    expect(invokeUpstreamTool).not.toHaveBeenCalled();

    const deniedUnknown = await mcpCall(base, agent.credential.token, 3, "not_a_real_tool");
    expect(deniedUnknown.status).toBe(200);
    expect(await deniedUnknown.text()).toContain("isError");
    expect(invokeUpstreamTool).not.toHaveBeenCalled();

    const allowed = await mcpCall(base, agent.credential.token, 4, "demo_echo");
    expect(allowed.status).toBe(200);
    expect(await allowed.text()).toContain("Echo: hello");
    expect(invokeUpstreamTool).toHaveBeenCalledTimes(1);
    expect(invokeUpstreamTool).toHaveBeenCalledWith(expect.objectContaining({ upstreamToolName: "echo" }));

    const revokedGrant = await fetch(`${base}/api/agents/${agent.agent.id}/access`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({
        connectionId: connection.id,
        read: false,
        write: false,
        resources: [],
        tools: tools.map((tool) => ({ ...tool, allowed: false })),
      }),
    });
    expect(revokedGrant.status).toBe(200);
    const afterRevoke = await mcpCall(base, agent.credential.token, 5, "demo_echo");
    expect(afterRevoke.status).toBe(200);
    expect(await afterRevoke.text()).toContain("isError");
    expect(invokeUpstreamTool).toHaveBeenCalledTimes(1);

    const hidden = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${agent.credential.token}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 6, method: "tools/list", params: {} }),
    });
    expect(hidden.status).toBe(200);
    expect(await hidden.text()).toContain('"tools":[]');

    const otherConnection = await fetch(`${base}/api/connections/${connection.id}`, {
      headers: { authorization: `Bearer ${otherSession.accessToken}` },
    });
    expect(otherConnection.status).toBe(404);
    const otherAudit = await fetch(`${base}/api/audit`, {
      headers: { authorization: `Bearer ${otherSession.accessToken}` },
    });
    expect(otherAudit.status).toBe(200);
    const otherLogs = (await otherAudit.json()) as Array<{ toolName: string }>;
    expect(otherLogs.some((item) => item.toolName === "demo_echo")).toBe(false);

    const github = await fetch(`${base}/api/oauth/github/start`, { method: "POST", headers: auth, body: "{}" });
    expect(github.status).toBe(403);
    const supabase = await fetch(`${base}/api/oauth/supabase/start`, { method: "POST", headers: auth, body: "{}" });
    expect(supabase.status).toBe(403);

    const ownerAudit = await fetch(`${base}/api/audit`, { headers: { authorization: `Bearer ${ownerSession.accessToken}` } });
    const ownerLogs = (await ownerAudit.json()) as Array<{ toolName: string; decision: string; status: string }>;
    expect(ownerLogs.some((item) => item.toolName === "demo_echo" && item.decision === "allow" && item.status === "success")).toBe(true);
    expect(ownerLogs.some((item) => item.toolName === "demo_add" && item.decision === "deny" && item.status === "denied")).toBe(true);
  });
});
