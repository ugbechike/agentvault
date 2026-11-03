import { z } from "zod";

import { connectableProviders } from "../constants/providers";

export const providerParamSchema = z.object({
  provider: z.enum(connectableProviders),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const createConnectionSchema = z.object({
  provider: z.enum(connectableProviders),
  projectRef: z.string().trim().min(1).max(120).optional(),
});

export const auditQuerySchema = z.object({
  agentId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type AuditQuery = z.infer<typeof auditQuerySchema>;
