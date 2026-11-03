import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), "../../.env") });

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().min(1).default("0.0.0.0"),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  JWT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  GITHUB_OAUTH_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  GITHUB_OAUTH_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SUPABASE_OAUTH_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SUPABASE_OAUTH_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type ApiEnv = z.infer<typeof envSchema>;

export const env: ApiEnv = envSchema.parse(process.env);

export const databaseConfigured = Boolean(env.DATABASE_URL);
