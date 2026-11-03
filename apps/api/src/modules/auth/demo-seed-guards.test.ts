import { describe, expect, it } from "vitest";

import { assertDemoSeedTarget, SeedRefused } from "./demo-seed-guards";

const cwd = "/work/agentvault-poc";
const databaseUrl = "postgres://demo_user:super-secret@db.example.internal:5432/agentvault";

describe("demo seed guards", () => {
  it("accepts an explicit remote target and does not return the password", () => {
    const target = assertDemoSeedTarget({
      confirm: "agentvault-demo",
      databaseUrl,
      credentialsFile: "/Users/owner/.agentvault/demo-credentials.txt",
      cwd,
    });
    expect(target.host).toBe("db.example.internal");
    expect(target.database).toBe("agentvault");
    expect(JSON.stringify(target)).not.toContain("super-secret");
    expect(() =>
      assertDemoSeedTarget({
        confirm: "agentvault-demo",
        databaseUrl,
        credentialsFile: "/work/agentvault-poc/secrets.txt",
        cwd: "/work/agentvault-poc/apps/api",
      }),
    ).toThrow(/outside the repository/);
  });

  it("refuses a missing confirmation, a local database, and a credentials file inside the repo", () => {
    expect(() =>
      assertDemoSeedTarget({
        confirm: undefined,
        databaseUrl,
        credentialsFile: "/tmp/demo-credentials.txt",
        cwd,
      }),
    ).toThrow(SeedRefused);
    expect(() =>
      assertDemoSeedTarget({
        confirm: "agentvault-demo",
        databaseUrl: "postgres://demo_user:super-secret@127.0.0.1:5432/agentvault",
        credentialsFile: "/tmp/demo-credentials.txt",
        cwd,
      }),
    ).toThrow(/local database/);
    expect(() =>
      assertDemoSeedTarget({
        confirm: "agentvault-demo",
        databaseUrl,
        credentialsFile: "/work/agentvault-poc/demo-credentials.txt",
        cwd,
      }),
    ).toThrow(/outside the repository/);
    expect(() =>
      assertDemoSeedTarget({
        confirm: "agentvault-demo",
        databaseUrl,
        credentialsFile: "demo-credentials.txt",
        cwd,
      }),
    ).toThrow(/absolute path/);
  });
});
