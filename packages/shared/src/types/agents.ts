export type AgentStatus = "active" | "revoked";

export type AgentClientKind = "cursor" | "claude-code" | "custom";

export interface AgentRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  clientKind: AgentClientKind;
  status: AgentStatus;
  createdAt: string;
}
