import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors/app-error";

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    if (error instanceof AppError) {
      request.log.info({ code: error.code, todo: error.todo }, error.message);
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          todo: error.todo ?? null,
        },
      });
    }

    const fastifyStatus = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 500;
    if (fastifyStatus >= 400 && fastifyStatus < 500) {
      return reply.status(fastifyStatus).send({
        error: {
          code: "BAD_REQUEST",
          message: "The request could not be read.",
        },
      });
    }

    request.log.error({ err: error }, "Unhandled error");
    return reply.status(500).send({
      error: {
        code: "INTERNAL",
        message: "Unexpected error.",
      },
    });
  });
};
