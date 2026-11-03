import type { DemoState } from "@/modules/demo/types";

export const summarizeWorkspace = (state: DemoState) => {
  const connected = state.connections.filter((connection) => connection.status === "connected");
  const activeAgents = state.agents.filter((agent) => agent.status === "active");
  const allowed = state.permissions.filter((permission) => permission.allowed);
  return {
    connected,
    connectedCount: connected.length,
    agentCount: activeAgents.length,
    allowedGrants: allowed.length,
    recent: [...state.activity].sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, 4),
  };
};
