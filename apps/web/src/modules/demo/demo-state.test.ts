import { describe, expect, it } from "vitest";

import { initialDemoState } from "./fixtures";
import { demoReducer } from "./demo-state";

describe("demo reducer", () => {
  it("refuses an agent grant the provider has not given", () => {
    const disconnected = demoReducer(initialDemoState, { type: "disconnect", provider: "github" });
    const next = demoReducer(disconnected, {
      type: "set-agent-capability",
      agentId: "agt_cursor",
      capability: "github.read",
      allowed: true,
    });
    const permission = next.permissions.find(
      (item) => item.agentId === "agt_cursor" && item.capability === "github.read",
    );
    expect(permission?.allowed).toBe(false);
  });

  it("starts a new agent with every capability denied", () => {
    const next = demoReducer(initialDemoState, {
      type: "register-agent",
      agent: {
        id: "agt_new",
        name: "Local agent",
        description: "A third consumer",
        clientKind: "custom",
        status: "active",
        createdAt: "2026-11-02T15:00:00.000Z",
      },
    });
    const grants = next.permissions.filter((item) => item.agentId === "agt_new" && item.allowed);
    expect(grants).toHaveLength(0);
  });

  it("clears agent grants when a simulated connection is removed", () => {
    const next = demoReducer(initialDemoState, { type: "disconnect", provider: "github" });
    const githubAllows = next.permissions.filter(
      (item) => item.capability.startsWith("github.") && item.allowed,
    );
    expect(githubAllows).toHaveLength(0);
    expect(next.connections.find((item) => item.provider === "github")?.status).toBe("not_connected");
  });
});
