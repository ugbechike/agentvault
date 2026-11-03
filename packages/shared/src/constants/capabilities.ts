export const capabilityIds = [
  "github.read",
  "github.write",
  "supabase.read",
  "supabase.write",
] as const;

export type CapabilityId = (typeof capabilityIds)[number];

export interface CapabilityDefinition {
  id: CapabilityId;
  provider: "github" | "supabase";
  label: string;
  description: string;
}

export const capabilityCatalog: readonly CapabilityDefinition[] = [
  {
    id: "github.read",
    provider: "github",
    label: "GitHub read",
    description: "Read repositories, file contents, and issue metadata through the GitHub connector.",
  },
  {
    id: "github.write",
    provider: "github",
    label: "GitHub write",
    description: "Create or modify GitHub resources, such as issues, when the provider grant includes write.",
  },
  {
    id: "supabase.read",
    provider: "supabase",
    label: "Supabase read",
    description: "Read project metadata and run read-only database operations on the selected Supabase project.",
  },
  {
    id: "supabase.write",
    provider: "supabase",
    label: "Supabase write",
    description: "Change data or schema on the selected Supabase project when the provider grant includes write.",
  },
];
