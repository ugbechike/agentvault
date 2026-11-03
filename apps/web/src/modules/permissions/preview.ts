import type { CapabilityId } from "@agentvault/shared";

import type { DemoState } from "@/modules/demo/types";

export interface EffectivePreview {
  capability: CapabilityId;
  agentId: string;
  providerGranted: boolean;
  agentAllowed: boolean;
  effective: boolean;
}

/** Browser preview of the intended rule. This does not authorize anything. */
export const previewEffective = (
  state: Pick<DemoState, "permissions">,
  agentId: string,
  capability: CapabilityId,
  providerConnected: boolean,
): EffectivePreview => {
  const providerGranted = providerConnected;
  const agentAllowed = Boolean(
    state.permissions.find((item) => item.agentId === agentId && item.capability === capability)?.allowed,
  );
  return {
    capability,
    agentId,
    providerGranted,
    agentAllowed,
    effective: providerGranted && agentAllowed,
  };
};
