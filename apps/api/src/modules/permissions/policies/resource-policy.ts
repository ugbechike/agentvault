import type { IllustrativeTool } from "@agentvault/shared";

export type ResourceAccessLevel = "read" | "write" | "deny";

export interface ResourceGrant {
  resourceKey: string;
  access: ResourceAccessLevel;
}

export interface ScopeDenial {
  reasonCode: "UNKNOWN_OPERATION" | "RESOURCE_DENIED" | "RESOURCE_UNSCOPED";
  reason: string;
}

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const repoKey = (owner: string, repo: string): string => normalizeKey(`${owner}/${repo}`);

const readString = (args: Record<string, unknown>, key: string): string =>
  typeof args[key] === "string" ? args[key].trim() : "";

/** Every repository an argument object names. Inconsistent owner/repo pairs are all returned so none can be skipped. */
export const repositoryTargets = (args: Record<string, unknown>): string[] => {
  const targets: string[] = [];
  const owner = readString(args, "owner");
  const repo = readString(args, "repo");
  const repository = readString(args, "repository");

  if (owner && repo.includes("/")) {
    const [repoOwner, repoName] = repo.split("/");
    if (repoOwner && repoName) {
      targets.push(repoKey(repoOwner, repoName));
      if (repoOwner.toLowerCase() !== owner.toLowerCase()) targets.push(repoKey(owner, repoName));
    }
  } else if (owner && repo) {
    targets.push(repoKey(owner, repo));
  } else if (repository.includes("/")) {
    targets.push(normalizeKey(repository));
  } else if (repo.includes("/")) {
    targets.push(normalizeKey(repo));
  }

  const parentOwner = readString(args, "parent_owner");
  const parentRepo = readString(args, "parent_repo");
  if (parentOwner && parentRepo && !parentRepo.includes("/")) targets.push(repoKey(parentOwner, parentRepo));

  return [...new Set(targets)];
};

const projectTargets = (args: Record<string, unknown>): string[] => {
  const keys = ["project_ref", "projectRef", "project_id", "projectId"]
    .map((key) => readString(args, key))
    .filter((value) => value.length > 0)
    .map(normalizeKey);
  return [...new Set(keys)];
};

const accessAllows = (access: ResourceAccessLevel, capability: "read" | "write"): boolean => {
  if (access === "deny") return false;
  if (capability === "read") return access === "read" || access === "write";
  return access === "write";
};

/**
 * Fail closed. An empty grant list means the provider token's full scope is allowed.
 * Any saved grant switches the connection to an explicit allowlist of resources.
 */
export const evaluateResourceScope = (input: {
  tool: Pick<IllustrativeTool, "resourceScope" | "allowedOperations">;
  args: Record<string, unknown>;
  grants: readonly ResourceGrant[];
  capability: "read" | "write";
  connectionProjectRef?: string | null;
}): ScopeDenial | null => {
  if (input.tool.allowedOperations) {
    const method = readString(input.args, "method");
    if (!input.tool.allowedOperations.includes(method)) {
      return {
        reasonCode: "UNKNOWN_OPERATION",
        reason: "This operation is not allowed for the tool.",
      };
    }
  }

  if (input.grants.length === 0) return null;

  if (input.tool.resourceScope === "none") return null;

  if (input.tool.resourceScope === "unbounded") {
    return {
      reasonCode: "RESOURCE_UNSCOPED",
      reason: "This tool can reach resources outside the saved restrictions.",
    };
  }

  const targets =
    input.tool.resourceScope === "project"
      ? projectTargets(input.args)
      : repositoryTargets(input.args);

  const effectiveTargets =
    targets.length > 0
      ? targets
      : input.tool.resourceScope === "project" && input.connectionProjectRef
        ? [normalizeKey(input.connectionProjectRef)]
        : [];

  if (effectiveTargets.length === 0) {
    return {
      reasonCode: "RESOURCE_UNSCOPED",
      reason: "The tool call did not name an allowed resource.",
    };
  }

  const grants = new Map(input.grants.map((grant) => [normalizeKey(grant.resourceKey), grant.access]));
  for (const target of effectiveTargets) {
    const access = grants.get(target);
    if (!access || !accessAllows(access, input.capability)) {
      return {
        reasonCode: "RESOURCE_DENIED",
        reason: "That resource is outside the access saved for this agent.",
      };
    }
  }

  return null;
};
