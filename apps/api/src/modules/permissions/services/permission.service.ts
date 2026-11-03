import type { PermissionCheckInput, PutAgentPermissionInput } from "@agentvault/shared";

import { NotImplementedError } from "@/lib/errors/app-error";
import { evaluateEffectiveAccess } from "@/modules/permissions/policies/effective-access";

export const listPermissions = async (): Promise<never> => {
  throw new NotImplementedError(
    "Permission list is not implemented.",
    "TODO(PERMISSIONS): Read agent_permissions for the signed-in user's agents.",
  );
};

export const putPermission = async (_input: PutAgentPermissionInput): Promise<never> => {
  throw new NotImplementedError(
    "Permission update is not implemented.",
    "TODO(PERMISSIONS): Upsert agent_permissions. An agent grant cannot exceed the provider grant.",
  );
};

export const evaluatePermission = async (input: PermissionCheckInput) => {
  return evaluateEffectiveAccess(input);
};
