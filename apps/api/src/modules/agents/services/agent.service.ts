import type { CreateAgentInput, UpdateAgentInput } from "@agentvault/shared";

import { NotImplementedError } from "@/lib/errors/app-error";

export const listAgents = async (): Promise<never> => {
  throw new NotImplementedError(
    "Agent list is not implemented.",
    "TODO(AGENTS): List agents for the signed-in user.",
  );
};

export const createAgent = async (_input: CreateAgentInput): Promise<never> => {
  throw new NotImplementedError(
    "Agent registration is not implemented.",
    "TODO(AGENTS): Insert an agents row. New agents start with no permissions.",
  );
};

export const getAgent = async (_agentId: string): Promise<never> => {
  throw new NotImplementedError(
    "Agent lookup is not implemented.",
    "TODO(AGENTS): Load the agent and its agent_permissions rows.",
  );
};

export const updateAgent = async (_agentId: string, _input: UpdateAgentInput): Promise<never> => {
  throw new NotImplementedError(
    "Agent update is not implemented.",
    "TODO(AGENTS): Update the agent name or description for the owning user.",
  );
};

export const revokeAgent = async (_agentId: string): Promise<never> => {
  throw new NotImplementedError(
    "Agent revoke is not implemented.",
    "TODO(AGENTS): Mark the agent revoked. Revoked agents must fail future tool calls.",
  );
};
