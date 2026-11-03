import type { CapabilityId } from "./capabilities";
import type { ProviderId } from "./providers";

/**
 * How a tool names the resource it touches.
 * `unbounded` tools can reach resources outside an explicit grant, so they are denied when grants exist.
 */
export type ResourceScope = "repository" | "project" | "unbounded" | "none";

export interface IllustrativeTool {
  agentvaultName: string;
  provider: ProviderId;
  requiredCapability: CapabilityId;
  description: string;
  /**
   * Upstream name from the GitHub remote MCP server tool catalog
   * (github/github-mcp-server) and the Supabase MCP catalog.
   * A tool is exposed only when discovery returns this exact name.
   */
  exampleUpstreamName: string;
  resourceScope: ResourceScope;
  /** When set, `arguments.method` must be one of these values or the call is denied. */
  allowedOperations?: readonly string[];
}

/**
 * Explicit gateway allowlist. Discovery may return more tools; only these names are exposed.
 * `execute_sql` is intentionally absent: arbitrary SQL is not a read-only capability.
 */
export const illustrativeAllowlist: readonly IllustrativeTool[] = [
  {
    agentvaultName: "github_get_file",
    provider: "github",
    requiredCapability: "github.read",
    description: "Read a file or directory from one repository.",
    exampleUpstreamName: "get_file_contents",
    resourceScope: "repository",
  },
  {
    agentvaultName: "github_list_commits",
    provider: "github",
    requiredCapability: "github.read",
    description: "List commits in one repository.",
    exampleUpstreamName: "list_commits",
    resourceScope: "repository",
  },
  {
    agentvaultName: "github_list_issues",
    provider: "github",
    requiredCapability: "github.read",
    description: "List issues in one repository.",
    exampleUpstreamName: "list_issues",
    resourceScope: "repository",
  },
  {
    agentvaultName: "github_read_issue",
    provider: "github",
    requiredCapability: "github.read",
    description: "Read one issue, including its comments when requested.",
    exampleUpstreamName: "issue_read",
    resourceScope: "repository",
  },
  {
    agentvaultName: "github_search_repositories",
    provider: "github",
    requiredCapability: "github.read",
    description: "Search repositories this GitHub account can reach. Unavailable once repository restrictions are saved.",
    exampleUpstreamName: "search_repositories",
    resourceScope: "unbounded",
  },
  {
    agentvaultName: "github_write_issue",
    provider: "github",
    requiredCapability: "github.write",
    description: "Create or update an issue in one repository.",
    exampleUpstreamName: "issue_write",
    resourceScope: "repository",
    allowedOperations: ["create", "update"],
  },
  {
    agentvaultName: "supabase_list_tables",
    provider: "supabase",
    requiredCapability: "supabase.read",
    description: "List tables in the selected Supabase project.",
    exampleUpstreamName: "list_tables",
    resourceScope: "project",
  },
];

export const agentvaultToolNames = illustrativeAllowlist.map((tool) => tool.agentvaultName);
