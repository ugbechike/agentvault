export const connectableProviders = ["demo", "github", "supabase"] as const;

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
 * Product catalog shown in the connectors UI.
 * `available` means a person can save a connection. It does not mean they signed in with the provider.
 * Keep implementation notes in docs/CONNECTORS_IMPLEMENTATION.md.
 */
export const connectorCatalog: readonly ConnectorCatalogEntry[] = [
  {
    provider: "demo",
    name: "Demo MCP Provider",
    description: "Connect to a safe test service and explore how AgentVault manages AI agent access to external tools.",
    status: "available",
    authModel: "Approve the demo provider, then choose which of its actions each agent can call.",
    capabilities: ["Synthetic read actions", "Per-agent access", "Disconnect at any time"],
  },
  {
    provider: "github",
    name: "GitHub",
    description: "Let agents read repositories and files, and open issues, when you allow it.",
    status: "planned",
    authModel: "Coming soon. You will choose which agents can use GitHub.",
    capabilities: ["Read files and commits", "Read and open issues", "Read or write access for each agent"],
  },
  {
    provider: "supabase",
    name: "Supabase",
    description: "Let agents work with one Supabase project. SQL execution is not offered as a read-only action.",
    status: "planned",
    authModel: "Coming soon. You will choose which agents can use a Supabase project.",
    capabilities: ["List project tables", "Read-only project scope", "No arbitrary SQL"],
  },
  {
    provider: "gmail",
    name: "Gmail",
    description: "Let agents read threads and send mail once Gmail can be connected.",
    status: "planned",
    authModel: "Coming soon. You will choose which agents can read mail or send it.",
    capabilities: ["Read threads", "Send mail"],
  },
  {
    provider: "google-drive",
    name: "Google Drive",
    description: "Let agents find and read files once Google Drive can be connected.",
    status: "planned",
    authModel: "Coming soon. You will choose which agents can browse and read files.",
    capabilities: ["List files", "Read file contents"],
  },
  {
    provider: "notion",
    name: "Notion",
    description: "Let agents search and read pages once Notion can be connected.",
    status: "planned",
    authModel: "Coming soon. You will choose which agents can search and read pages.",
    capabilities: ["Search pages", "Read page content"],
  },
];
