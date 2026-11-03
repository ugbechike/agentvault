export const connectableProviders = ["github", "supabase"] as const;

export type ProviderId = (typeof connectableProviders)[number];

export type CatalogProviderStatus = "available" | "planned";

export interface ConnectorCatalogEntry {
  provider: string;
  name: string;
  description: string;
  status: CatalogProviderStatus;
  authModel: string;
  capabilities: readonly string[];
}

/**
 * Product catalog. `available` means AgentVault has an adapter skeleton.
 * It does not mean a user has authorized the provider.
 */
export const connectorCatalog: readonly ConnectorCatalogEntry[] = [
  {
    provider: "github",
    name: "GitHub",
    description: "Repository, issue, and file tools through GitHub's hosted remote MCP server.",
    status: "available",
    authModel: "GitHub OAuth or a user-approved GitHub credential. Not implemented.",
    capabilities: ["Read repositories and files", "Create issues", "Tool discovery from the remote MCP server"],
  },
  {
    provider: "supabase",
    name: "Supabase",
    description: "Project-scoped database and management tools through Supabase's hosted MCP server.",
    status: "available",
    authModel: "Supabase OAuth scoped to one project. Not the same flow as GitHub.",
    capabilities: ["List project tables", "Read-only queries", "Write access only when explicitly granted"],
  },
  {
    provider: "gmail",
    name: "Gmail",
    description: "Mailbox tools for a future connector. No adapter exists in this POC.",
    status: "planned",
    authModel: "Google OAuth. Not designed yet.",
    capabilities: ["Read threads", "Send mail"],
  },
  {
    provider: "google-drive",
    name: "Google Drive",
    description: "File tools for a future connector. No adapter exists in this POC.",
    status: "planned",
    authModel: "Google OAuth. Not designed yet.",
    capabilities: ["List files", "Read file contents"],
  },
  {
    provider: "notion",
    name: "Notion",
    description: "Workspace tools for a future connector. No adapter exists in this POC.",
    status: "planned",
    authModel: "Notion OAuth. Not designed yet.",
    capabilities: ["Search pages", "Read page content"],
  },
];
