import { describe, expect, it } from "vitest";

import { intersectAccess } from "@/modules/permissions/policies/effective-access";
import { evaluateResourceScope, repositoryTargets } from "@/modules/permissions/policies/resource-policy";

const base = {
  agentId: "agent",
  connectionId: "connection",
  toolName: "github_get_file",
  requiredCapability: "github.read" as const,
  providerGranted: ["github.read"] as const,
  agentAllowed: ["github.read"] as const,
  toolAllowlisted: true,
  connectionActive: true,
  agentActive: true,
};

describe("intersectAccess", () => {
  it("allows only when every gate passes", () => {
    expect(intersectAccess(base).outcome).toBe("allow");
  });

  it("denies a write capability the agent does not have", () => {
    const decision = intersectAccess({
      ...base,
      toolName: "github_write_issue",
      requiredCapability: "github.write",
      providerGranted: ["github.read", "github.write"],
    });
    expect(decision.outcome).toBe("deny");
    expect(decision.reasonCode).toBe("AGENT_POLICY_DENY");
  });

  it("denies when the provider grant is missing", () => {
    const decision = intersectAccess({ ...base, providerGranted: [] });
    expect(decision.reasonCode).toBe("PROVIDER_SCOPE_MISSING");
  });

  it("denies a revoked agent before any tool call", () => {
    expect(intersectAccess({ ...base, agentActive: false }).reasonCode).toBe("AGENT_REVOKED");
  });
});

describe("repository restrictions", () => {
  const tool = { resourceScope: "repository" as const };

  it("reads owner and repo arguments", () => {
    expect(repositoryTargets({ owner: "Octo", repo: "Vault" })).toEqual(["octo/vault"]);
  });

  it("allows an included repository and denies an excluded one", () => {
    const grants = [
      { resourceKey: "octo/allowed", access: "read" as const },
      { resourceKey: "octo/secret", access: "deny" as const },
    ];
    expect(
      evaluateResourceScope({ tool, args: { owner: "octo", repo: "allowed" }, grants, capability: "read" }),
    ).toBeNull();
    expect(
      evaluateResourceScope({ tool, args: { owner: "octo", repo: "secret" }, grants, capability: "read" })?.reasonCode,
    ).toBe("RESOURCE_DENIED");
    expect(
      evaluateResourceScope({ tool, args: { owner: "octo", repo: "other" }, grants, capability: "read" })?.reasonCode,
    ).toBe("RESOURCE_DENIED");
  });

  it("denies write on a read-only repository", () => {
    const denial = evaluateResourceScope({
      tool,
      args: { owner: "octo", repo: "allowed" },
      grants: [{ resourceKey: "octo/allowed", access: "read" }],
      capability: "write",
    });
    expect(denial?.reasonCode).toBe("RESOURCE_DENIED");
  });

  it("denies a repository search once restrictions exist", () => {
    const denial = evaluateResourceScope({
      tool: { resourceScope: "unbounded" },
      args: { query: "org:octo" },
      grants: [{ resourceKey: "octo/allowed", access: "write" }],
      capability: "read",
    });
    expect(denial?.reasonCode).toBe("RESOURCE_UNSCOPED");
  });

  it("denies an unknown issue_write method", () => {
    const denial = evaluateResourceScope({
      tool: { resourceScope: "repository", allowedOperations: ["create", "update"] },
      args: { owner: "octo", repo: "allowed", method: "delete" },
      grants: [],
      capability: "write",
    });
    expect(denial?.reasonCode).toBe("UNKNOWN_OPERATION");
  });

  it("requires a resource when restrictions exist and the call names none", () => {
    const denial = evaluateResourceScope({
      tool,
      args: {},
      grants: [{ resourceKey: "octo/allowed", access: "write" }],
      capability: "read",
    });
    expect(denial?.reasonCode).toBe("RESOURCE_UNSCOPED");
  });
});
