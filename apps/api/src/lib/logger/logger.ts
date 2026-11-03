import type { FastifyServerOptions } from "fastify";

import { env } from "@/lib/config/env";

/** Redact credentials. Do not add request bodies; they may contain passwords. */
export const loggerOptions: FastifyServerOptions["logger"] =
  env.NODE_ENV === "test"
    ? false
    : {
        level: env.LOG_LEVEL,
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "password",
            "passwordHash",
            "token",
            "accessToken",
            "refreshToken",
            "authorization",
            "DATABASE_URL",
            "JWT_SECRET",
          ],
          censor: "[redacted]",
        },
      };
