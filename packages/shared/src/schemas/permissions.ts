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

export const resourceAccessSchema = z.enum(["read", "write", "deny"]);

export const saveAgentAccessSchema = z.object({
  connectionId: z.string().uuid(),
  read: z.boolean(),
  write: z.boolean(),
  resources: z
    .array(
      z.object({
        resourceKey: z.string().trim().min(1).max(200),
        access: resourceAccessSchema,
      }),
    )
    .max(100),
  tools: z
    .array(
      z.object({
        toolName: z.string().trim().min(1).max(120),
        allowed: z.boolean(),
      }),
    )
    .max(50)
    .optional(),
});

export type PutAgentPermissionInput = z.infer<typeof putAgentPermissionSchema>;
export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>;
export type SaveAgentAccessInput = z.infer<typeof saveAgentAccessSchema>;
export type ResourceAccess = z.infer<typeof resourceAccessSchema>;
