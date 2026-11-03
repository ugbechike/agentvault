import type { CapabilityId } from "./capabilities";
import type { ProviderId } from "./providers";

export interface IllustrativeTool {
  agentvaultName: string;
  provider: ProviderId;
  requiredCapability: CapabilityId;
  description: string;
  /** Illustrative only. Do not assume this matches the upstream MCP tool name. */
  exampleUpstreamName: string;
}

/**
 * Explicit gateway allowlist shape. These names are the AgentVault-facing identifiers
 * the future mapper may emit. They are not a live tools/list result.
 */
export const illustrativeAllowlist: readonly IllustrativeTool[] = [
  {
    agentvaultName: "github_list_repositories",
    provider: "github",
    requiredCapability: "github.read",
    description: "List repositories this GitHub connection can reach.",
    exampleUpstreamName: "list_repositories",
  },
  {
    agentvaultName: "github_get_file",
    provider: "github",
    requiredCapability: "github.read",
    description: "Read one file from a repository.",
    exampleUpstreamName: "get_file_contents",
  },
  {
    agentvaultName: "github_create_issue",
    provider: "github",
    requiredCapability: "github.write",
    description: "Open an issue in a repository.",
    exampleUpstreamName: "create_issue",
  },
  {
    agentvaultName: "supabase_list_tables",
    provider: "supabase",
    requiredCapability: "supabase.read",
    description: "List tables in the selected Supabase project.",
    exampleUpstreamName: "list_tables",
  },
  {
    agentvaultName: "supabase_query_database",
    provider: "supabase",
    requiredCapability: "supabase.read",
    description: "Run a read query against the selected Supabase project.",
    exampleUpstreamName: "execute_sql",
  },
];

export const agentvaultToolNames = illustrativeAllowlist.map((tool) => tool.agentvaultName);
