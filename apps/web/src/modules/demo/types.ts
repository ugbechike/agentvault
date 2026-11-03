import type { AgentClientKind, CapabilityId, ProviderId } from "@agentvault/shared";

export interface DemoSession {
  userId: string;
  name: string;
  email: string;
  mock: true;
}

export interface DemoConnection {
  id: string;
  provider: ProviderId;
  status: "connected" | "not_connected";
  accountLabel: string | null;
  projectRef: string | null;
  grantedCapabilities: CapabilityId[];
  lastSuccessAt: string | null;
  simulated: true;
}

export interface DemoAgent {
  id: string;
  name: string;
  description: string;
  clientKind: AgentClientKind;
  status: "active" | "revoked";
  createdAt: string;
}

export interface DemoPermission {
  agentId: string;
  capability: CapabilityId;
  allowed: boolean;
}

export interface DemoTool {
  id: string;
  provider: ProviderId;
  upstreamName: string;
  agentvaultName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiredCapability: CapabilityId;
  illustrative: true;
}

export interface DemoActivity {
  id: string;
  agentId: string;
  agentName: string;
  provider: ProviderId;
  toolName: string;
  timestamp: string;
  decision: "allow" | "deny";
  decisionReason: string;
  status: "success" | "failure" | "denied";
  durationMs: number;
  simulated: true;
}

export interface DemoState {
  session: DemoSession | null;
  connections: DemoConnection[];
  agents: DemoAgent[];
  permissions: DemoPermission[];
  activity: DemoActivity[];
}
