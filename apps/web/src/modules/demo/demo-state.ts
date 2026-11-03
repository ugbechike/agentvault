import type { CapabilityId, ProviderId } from "@agentvault/shared";

import { initialDemoState } from "./fixtures";
import type { DemoAgent, DemoPermission, DemoSession, DemoState } from "./types";

export interface ConnectSimulation {
  provider: ProviderId;
  accountLabel: string;
  projectRef?: string;
  granted: CapabilityId[];
  agentGrants: readonly { agentId: string; capabilities: readonly CapabilityId[] }[];
}

export type DemoAction =
  | { type: "sign-in"; session: DemoSession }
  | { type: "sign-out" }
  | { type: "update-profile"; name: string; email: string }
  | { type: "connect"; input: ConnectSimulation; at: string }
  | { type: "disconnect"; provider: ProviderId }
  | { type: "register-agent"; agent: DemoAgent }
  | { type: "revoke-agent"; agentId: string }
  | { type: "set-agent-capability"; agentId: string; capability: CapabilityId; allowed: boolean }
  | { type: "set-connection-capability"; provider: ProviderId; capability: CapabilityId; allowed: boolean }
  | { type: "reset-workspace" };

const providerOf = (capability: CapabilityId): ProviderId =>
  capability.startsWith("github.") ? "github" : "supabase";

const grantFor = (state: DemoState, capability: CapabilityId): boolean => {
  const provider = providerOf(capability);
  const connection = state.connections.find((item) => item.provider === provider);
  return Boolean(connection?.status === "connected" && connection.grantedCapabilities.includes(capability));
};

const upsertPermission = (
  permissions: DemoPermission[],
  agentId: string,
  capability: CapabilityId,
  allowed: boolean,
): DemoPermission[] => {
  const index = permissions.findIndex((item) => item.agentId === agentId && item.capability === capability);
  if (index === -1) {
    return [...permissions, { agentId, capability, allowed }];
  }
  return permissions.map((item, itemIndex) => (itemIndex === index ? { ...item, allowed } : item));
};

export const demoReducer = (state: DemoState, action: DemoAction): DemoState => {
  switch (action.type) {
    case "sign-in":
      return { ...state, session: action.session };
    case "sign-out":
      return { ...state, session: null };
    case "update-profile":
      if (!state.session) {
        return state;
      }
      return { ...state, session: { ...state.session, name: action.name, email: action.email } };
    case "connect": {
      const granted = action.input.granted.filter((capability) => providerOf(capability) === action.input.provider);
      const connections = state.connections.map((connection) =>
        connection.provider === action.input.provider
          ? {
              ...connection,
              status: "connected" as const,
              accountLabel: action.input.accountLabel,
              projectRef: action.input.projectRef ?? null,
              grantedCapabilities: granted,
              lastSuccessAt: action.at,
            }
          : connection,
      );
      let permissions = state.permissions.filter(
        (permission) => providerOf(permission.capability) !== action.input.provider,
      );
      for (const grant of action.input.agentGrants) {
        for (const capability of grant.capabilities) {
          if (granted.includes(capability)) {
            permissions = upsertPermission(permissions, grant.agentId, capability, true);
          }
        }
      }
      return { ...state, connections, permissions };
    }
    case "disconnect":
      return {
        ...state,
        connections: state.connections.map((connection) =>
          connection.provider === action.provider
            ? {
                ...connection,
                status: "not_connected",
                accountLabel: null,
                projectRef: null,
                grantedCapabilities: [],
                lastSuccessAt: connection.lastSuccessAt,
              }
            : connection,
        ),
        permissions: state.permissions.map((permission) =>
          providerOf(permission.capability) === action.provider ? { ...permission, allowed: false } : permission,
        ),
      };
    case "register-agent":
      return {
        ...state,
        agents: [action.agent, ...state.agents],
        permissions: [
          ...state.permissions,
          ...(["github.read", "github.write", "supabase.read", "supabase.write"] as const).map((capability) => ({
            agentId: action.agent.id,
            capability,
            allowed: false,
          })),
        ],
      };
    case "revoke-agent":
      return {
        ...state,
        agents: state.agents.map((agent) =>
          agent.id === action.agentId ? { ...agent, status: "revoked" as const } : agent,
        ),
        permissions: state.permissions.map((permission) =>
          permission.agentId === action.agentId ? { ...permission, allowed: false } : permission,
        ),
      };
    case "set-agent-capability": {
      if (action.allowed && !grantFor(state, action.capability)) {
        return state;
      }
      const agent = state.agents.find((item) => item.id === action.agentId);
      if (!agent || agent.status !== "active") {
        return state;
      }
      return {
        ...state,
        permissions: upsertPermission(state.permissions, action.agentId, action.capability, action.allowed),
      };
    }
    case "set-connection-capability": {
      if (providerOf(action.capability) !== action.provider) {
        return state;
      }
      const connections = state.connections.map((connection) => {
        if (connection.provider !== action.provider || connection.status !== "connected") {
          return connection;
        }
        const granted = new Set(connection.grantedCapabilities);
        if (action.allowed) {
          granted.add(action.capability);
        } else {
          granted.delete(action.capability);
        }
        return { ...connection, grantedCapabilities: [...granted] };
      });
      const permissions = action.allowed
        ? state.permissions
        : state.permissions.map((permission) =>
            permission.capability === action.capability ? { ...permission, allowed: false } : permission,
          );
      return { ...state, connections, permissions };
    }
    case "reset-workspace":
      return { ...initialDemoState, session: state.session };
    default:
      return state;
  }
};
