import { describe, expect, it } from "vitest";

import { initialDemoState } from "./fixtures";
import { demoReducer } from "./demo-state";
import type { DemoState } from "./types";
import { previewEffective } from "@/modules/permissions/preview";

const withGithub = (): DemoState => ({
  ...initialDemoState,
  connections: [
    {
      id: "con_github",
      provider: "github",
      status: "connected",
      accountLabel: "octocat",
      projectRef: null,
      grantedCapabilities: ["github.read"],
      lastSuccessAt: null,
      simulated: true,
    },
  ],
  agents: [
    {
      id: "agt_cursor",
      name: "Cursor",
      description: "",
      clientKind: "cursor",
      status: "active",
      createdAt: "2026-11-02T15:00:00.000Z",
    },
  ],
  permissions: [{ agentId: "agt_cursor", capability: "github.read", allowed: true }],
});

describe("demo reducer", () => {
  it("records an agent policy even when the provider is not connected", () => {
    const registered = demoReducer(initialDemoState, {
      type: "register-agent",
      agent: {
        id: "agt_new",
        name: "Local agent",
        description: "",
        clientKind: "custom",
        status: "active",
        createdAt: "2026-11-02T15:00:00.000Z",
      },
    });
    const next = demoReducer(registered, {
      type: "set-agent-capability",
      agentId: "agt_new",
      capability: "github.read",
      allowed: true,
    });
    const permission = next.permissions.find((item) => item.agentId === "agt_new" && item.capability === "github.read");
    expect(permission?.allowed).toBe(true);
    expect(previewEffective(next, "agt_new", "github.read", false).effective).toBe(false);
    expect(previewEffective(next, "agt_new", "github.read", true).effective).toBe(true);
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

  it("clears agent grants when a connection record is removed", () => {
    const next = demoReducer(withGithub(), { type: "disconnect", provider: "github" });
    const githubAllows = next.permissions.filter((item) => item.capability.startsWith("github.") && item.allowed);
    expect(githubAllows).toHaveLength(0);
    expect(next.connections.find((item) => item.provider === "github")?.status).toBe("not_connected");
  });
});
