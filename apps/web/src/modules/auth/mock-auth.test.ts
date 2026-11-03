import { describe, expect, it } from "vitest";

import { mockForgotPassword, mockSignIn, mockSignUp } from "./mock-auth";

describe("mock auth", () => {
  it("accepts only the published demo password", () => {
    expect(mockSignIn({ email: "ada@agentvault.dev", password: "vault-demo" }).ok).toBe(true);
    const rejected = mockSignIn({ email: "ada@agentvault.dev", password: "not-the-demo" });
    expect(rejected.ok).toBe(false);
  });

  it("rejects a mismatched sign-up confirmation", () => {
    const result = mockSignUp({
      name: "Ada Okonkwo",
      email: "ada@agentvault.dev",
      password: "vault-demo",
      confirmPassword: "different",
    });
    expect(result.ok).toBe(false);
  });

  it("does not claim an email was sent", () => {
    const result = mockForgotPassword({ email: "ada@agentvault.dev" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toContain("No email was sent");
    }
  });
});
