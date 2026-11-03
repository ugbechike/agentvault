import type { ZodType } from "zod";

export const parseInput = <T>(schema: ZodType<T>, value: unknown): T => schema.parse(value);
