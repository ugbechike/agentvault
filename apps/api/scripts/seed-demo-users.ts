import { randomBytes } from "node:crypto";
import { chmodSync, writeFileSync } from "node:fs";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { users } from "../src/db/schema/users";
import { demoAccountEmails, assertDemoSeedTarget, SeedRefused } from "../src/modules/auth/demo-seed-guards";
import { passwordHasher } from "../src/modules/auth/services/password.service";

const passwordFor = (): string => randomBytes(24).toString("base64url");

const main = async (): Promise<void> => {
  const rotate = process.argv.includes("--rotate");
  let target: ReturnType<typeof assertDemoSeedTarget>;
  try {
    target = assertDemoSeedTarget({
      confirm: process.env.CONFIRM_PRODUCTION_SEED,
      databaseUrl: process.env.DATABASE_URL,
      credentialsFile: process.env.DEMO_CREDENTIALS_FILE,
      cwd: process.cwd(),
    });
  } catch (error) {
    const message = error instanceof SeedRefused ? error.message : "The seed target was refused.";
    console.error(message);
    process.exitCode = 1;
    return;
  }

  console.log(`Database host: ${target.host}`);
  console.log(`Database name: ${target.database}`);

  const sql = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  const db = drizzle(sql);
  const generated: { email: string; password: string }[] = [];

  try {
    const columns = await sql<{ column_name: string }[]>`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'users'
    `;
    const names = new Set(columns.map((column) => column.column_name));
    for (const required of ["id", "email", "name", "password_hash"]) {
      if (!names.has(required)) {
        console.error(`Refusing to seed. The users table is missing ${required}.`);
        process.exitCode = 1;
        return;
      }
    }

    const existing = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.email, [...demoAccountEmails]));
    const present = new Set(existing.map((row) => row.email));

    for (const email of demoAccountEmails) {
      if (present.has(email) && !rotate) {
        console.log(`${email} already present`);
        continue;
      }
      const password = passwordFor();
      const passwordHash = await passwordHasher.hash(password);
      if (present.has(email)) {
        await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.email, email));
        console.log(`${email} password rotated`);
      } else {
        await db.insert(users).values({ email, name: "Demo user", passwordHash });
        console.log(`${email} created`);
      }
      generated.push({ email, password });
    }
  } catch {
    console.error("Database connection failed. The connection string was not printed.");
    process.exitCode = 1;
    return;
  } finally {
    await sql.end({ timeout: 1 });
  }

  if (generated.length === 0) {
    console.log("No accounts were created or rotated. Credentials file was not written.");
    return;
  }

  const body = `${generated.map((item) => `${item.email} ${item.password}`).join("\n")}\n`;
  try {
    writeFileSync(target.credentialsFile, body, { encoding: "utf8", mode: 0o600, flag: rotate ? "w" : "wx" });
    chmodSync(target.credentialsFile, 0o600);
  } catch {
    console.error("Credentials could not be written. If the file already exists, choose a new DEMO_CREDENTIALS_FILE.");
    process.exitCode = 1;
    return;
  }
  console.log(`Credentials written to: ${target.credentialsFile}`);
};

await main();
