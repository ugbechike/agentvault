import type { DemoState } from "./types";

export const initialDemoState: DemoState = {
  session: null,
  connections: [],
  agents: [],
  permissions: [],
  activity: [],
  resources: [],
  toolPolicies: [],
};

export const demoUser = {
  userId: "usr_ada",
  name: "Ada Okonkwo",
  email: "ada@agentvault.dev",
  password: "vault-demo",
} as const;
