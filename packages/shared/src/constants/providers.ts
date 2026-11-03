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
 * Product catalog shown in the connectors UI.
 * `available` means a person can save a connection. It does not mean they signed in with the provider.
 * Keep implementation notes in docs/CONNECTORS_IMPLEMENTATION.md.
 */
export const connectorCatalog: readonly ConnectorCatalogEntry[] = [
  {
    provider: "github",
    name: "GitHub",
    description: "Let agents read repositories and files, and open issues, when you allow it.",
    status: "available",
    authModel: "Choose which agents can use GitHub, and whether they can only read or also make changes.",
    capabilities: ["Read repositories and files", "Open issues", "Read or write access for each agent"],
  },
  {
    provider: "supabase",
    name: "Supabase",
    description: "Let agents work with one Supabase project, and only in the ways you allow.",
    status: "available",
    authModel: "Name the project agents may use, then choose who can read it or make changes.",
    capabilities: ["List project tables", "Run read queries", "Write access only when you allow it"],
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
