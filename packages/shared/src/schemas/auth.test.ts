import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth";
import { permissionCheckSchema } from "./permissions";

describe("auth schemas", () => {
  it("rejects a login with a short password", () => {
    const result = loginSchema.safeParse({ email: "ada@agentvault.dev", password: "short" });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed registration", () => {
    const result = registerSchema.safeParse({
      name: "Ada Okonkwo",
      email: "ada@agentvault.dev",
      password: "vault-demo",
    });
    expect(result.success).toBe(true);
  });
});

describe("permission check schema", () => {
  it("does not accept a client-supplied allow list", () => {
    const result = permissionCheckSchema.safeParse({
      agentId: "agt_cursor",
      connectionId: "con_github",
      toolName: "github_create_issue",
      capability: "github.write",
      providerGranted: ["github.write"],
      allowed: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("providerGranted");
      expect(result.data).not.toHaveProperty("allowed");
    }
  });
});
