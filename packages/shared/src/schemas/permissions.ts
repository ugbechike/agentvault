import { z } from "zod";

import { capabilityIds } from "../constants/capabilities";

export const putAgentPermissionSchema = z.object({
  agentId: z.string().min(1),
  connectionId: z.string().min(1),
  capability: z.enum(capabilityIds),
  allowed: z.boolean(),
});

export const permissionCheckSchema = z.object({
  agentId: z.string().min(1),
  connectionId: z.string().min(1),
  toolName: z.string().min(1),
  capability: z.enum(capabilityIds),
});

export type PutAgentPermissionInput = z.infer<typeof putAgentPermissionSchema>;
export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>;
