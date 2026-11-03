import { z } from "zod";

export const agentClientKindSchema = z.enum(["cursor", "claude-code", "custom"]);

export const createAgentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(0).max(280),
  clientKind: agentClientKindSchema,
});

export const updateAgentSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(280).optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
