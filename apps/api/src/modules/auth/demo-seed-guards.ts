import { isAbsolute, relative, resolve, sep } from "node:path";

export const demoSeedConfirmation = "agentvault-demo";

export const demoAccountEmails = [
  "demo1@agentvault.example",
  "demo2@agentvault.example",
  "demo3@agentvault.example",
  "demo4@agentvault.example",
  "demo5@agentvault.example",
] as const;

export class SeedRefused extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedRefused";
  }
}

export interface DemoSeedTarget {
  host: string;
  database: string;
  credentialsFile: string;
}

const inside = (root: string, target: string): boolean => {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};

/**
 * Checks the production seed target without printing the connection string.
 * The caller must pass DATABASE_URL from the process environment, not from a loaded dotenv file.
 */
export const assertDemoSeedTarget = (input: {
  confirm: string | undefined;
  databaseUrl: string | undefined;
  credentialsFile: string | undefined;
  cwd: string;
}): DemoSeedTarget => {
  if (input.confirm !== demoSeedConfirmation) {
    throw new SeedRefused("Set CONFIRM_PRODUCTION_SEED=agentvault-demo to confirm this database.");
  }
  if (!input.databaseUrl) {
    throw new SeedRefused("Set DATABASE_URL in the environment. This command does not read a local env file.");
  }
  if (!input.credentialsFile || !isAbsolute(input.credentialsFile)) {
    throw new SeedRefused("Set DEMO_CREDENTIALS_FILE to an absolute path outside the repository.");
  }

  let parsed: URL;
  try {
    parsed = new URL(input.databaseUrl);
  } catch {
    throw new SeedRefused("DATABASE_URL could not be read.");
  }
  const host = parsed.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1" || host === "::1") {
    throw new SeedRefused("Refusing to seed a local database. Point DATABASE_URL at the deployed database.");
  }
  const database = parsed.pathname.replace(/^\//, "");
  if (!database) throw new SeedRefused("DATABASE_URL could not be read.");

  const credentialsFile = resolve(input.credentialsFile);
  const cwd = resolve(input.cwd);
  const roots = [cwd];
  if (cwd.endsWith(`${sep}apps${sep}api`)) roots.push(resolve(cwd, "../.."));
  if (roots.some((root) => inside(root, credentialsFile))) {
    throw new SeedRefused("DEMO_CREDENTIALS_FILE must be outside the repository.");
  }

  return { host, database, credentialsFile };
};
